import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      const uniqueEmail = `${uniqueUsername}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: uniqueUsername,
          email: uniqueEmail,
          password: 'TestPassword123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'username',
        uniqueUsername,
      );
      expect(response.body).toHaveProperty(
        'email',
        uniqueEmail,
      );
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const uniqueUsername = `loginuser_${Date.now()}`;
      const uniqueEmail = `${uniqueUsername}@example.com`;
      const password = 'TestPassword123';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: uniqueUsername,
          email: uniqueEmail,
          password,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: uniqueUsername,
          password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
    });
  });
});

describe('Posts (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          content: 'Unauthorized post',
          contentType: 'text',
          caption: 'Test',
        })
        .expect(401);
    });

    it('should create a post for an authenticated user', async () => {
      const username = `postuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Authenticated test post',
          contentType: 'text',
          caption: 'E2E Test',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'content',
        'Authenticated test post',
      );
    });
  });
});

describe('Comments (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts/:postId/comments', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/posts/1/comments')
        .send({
          text: 'Unauthorized comment',
        })
        .expect(401);
    });

    it('should create a top-level comment', async () => {
      const username = `commentuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Post for comment test',
          contentType: 'text',
        })
        .expect(201);

      const postId = postResponse.body.id;

      const commentResponse = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'This is a test comment',
        })
        .expect(201);

      expect(commentResponse.body).toHaveProperty('id');
      expect(commentResponse.body).toHaveProperty(
        'text',
        'This is a test comment',
      );
      expect(commentResponse.body).toHaveProperty(
        'postId',
        postId,
      );
    });

    it('should create a reply to an existing comment', async () => {
      const username = `replyuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Post for reply test',
          contentType: 'text',
        })
        .expect(201);

      const postId = postResponse.body.id;

      const commentResponse = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Parent comment',
        })
        .expect(201);

      const commentId = commentResponse.body.id;

      const replyResponse = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'This is a reply',
          parentCommentId: commentId,
        })
        .expect(201);

      expect(replyResponse.body).toHaveProperty('id');
      expect(replyResponse.body).toHaveProperty(
        'text',
        'This is a reply',
      );
      expect(replyResponse.body).toHaveProperty(
        'parentCommentId',
        commentId,
      );
    });
  });
});
