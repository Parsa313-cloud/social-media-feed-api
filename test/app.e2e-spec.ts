import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';import { Test, TestingModule } from '@nestjs/testing';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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
describe('Feed (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /posts', () => {
    it('should return paginated posts with comments metadata', async () => {
      const username = `feeduser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Create first post
      const firstPostResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'First feed post',
          contentType: 'text',
          caption: 'First',
        })
        .expect(201);

      const firstPostId = firstPostResponse.body.id;

      // Create top-level comment
      const commentResponse = await request(app.getHttpServer())
        .post(`/posts/${firstPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'First comment',
        })
        .expect(201);

      const commentId = commentResponse.body.id;

      // Create reply
      await request(app.getHttpServer())
        .post(`/posts/${firstPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Reply to first comment',
          parentCommentId: commentId,
        })
        .expect(201);

      // Create second post
      const secondPostResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Second feed post',
          contentType: 'text',
          caption: 'Second',
        })
        .expect(201);

      const secondPostId = secondPostResponse.body.id;

      // Get feed
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('pagination');

      expect(response.body.pagination).toEqual({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: expect.any(Number),
      });

      expect(response.body.items.length).toBeGreaterThanOrEqual(2);

      // Newest post should come first
      expect(response.body.items[0].id).toBe(secondPostId);

      const firstPost = response.body.items.find(
        (post: any) => post.id === firstPostId,
      );

      expect(firstPost).toBeDefined();

      // Comment count must include replies
      expect(firstPost.totalComments).toBe(2);

      // Author information
      expect(firstPost.author).toEqual({
        id: expect.any(Number),
        username,
      });

      // Latest comment
      expect(firstPost.latestComment).not.toBeNull();
      expect(firstPost.latestComment.text).toBe(
        'Reply to first comment',
      );
      expect(firstPost.latestComment.author).toEqual({
        id: expect.any(Number),
        username,
      });
    });
  });
});

describe('Post Detail (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /posts/:postId', () => {
    it('should return post details with paginated top-level comments', async () => {
      const username = `detailuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Create post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Post detail test',
          contentType: 'text',
          caption: 'Detail',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Create first top-level comment
      const firstCommentResponse = await request(
        app.getHttpServer(),
      )
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'First comment',
        })
        .expect(201);

      const firstCommentId = firstCommentResponse.body.id;

      // Create two replies to first comment
      await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'First reply',
          parentCommentId: firstCommentId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Second reply',
          parentCommentId: firstCommentId,
        })
        .expect(201);

      // Create second top-level comment
      const secondCommentResponse = await request(
        app.getHttpServer(),
      )
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Second comment',
        })
        .expect(201);

      const secondCommentId = secondCommentResponse.body.id;

      // Get post detail
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      // Post information
      expect(response.body).toHaveProperty('id', postId);
      expect(response.body).toHaveProperty('content', 'Post detail test');

      // Author information
      expect(response.body.author).toEqual({
        id: expect.any(Number),
        username,
      });

      // Pagination
      expect(response.body.pagination).toEqual({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 2,
      });

      // Only top-level comments should be returned
      expect(response.body.comments).toHaveLength(2);

      const firstComment = response.body.comments.find(
        (comment: any) => comment.id === firstCommentId,
      );

      const secondComment = response.body.comments.find(
        (comment: any) => comment.id === secondCommentId,
      );

      expect(firstComment).toBeDefined();
      expect(secondComment).toBeDefined();

      // First comment has two replies
      expect(firstComment.totalReplies).toBe(2);

      // Second comment has no replies
      expect(secondComment.totalReplies).toBe(0);

      // Comment author
      expect(firstComment.author).toEqual({
        id: expect.any(Number),
        username,
      });

      // Replies must not appear as top-level comments
      expect(
        response.body.comments.some(
          (comment: any) => comment.text === 'First reply',
        ),
      ).toBe(false);

      expect(
        response.body.comments.some(
          (comment: any) => comment.text === 'Second reply',
        ),
      ).toBe(false);
    });

    it('should return 404 for a non-existent post', async () => {
      await request(app.getHttpServer())
        .get('/posts/999999')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(404);
    });
  });
});

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/:userId/profile', () => {
    it('should return user statistics and recent mixed actions', async () => {
      const username = `profileuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      // Register
      const registerResponse = await request(
        app.getHttpServer(),
      )
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      const userId = registerResponse.body.id;

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Create first post
      const firstPostResponse = await request(
        app.getHttpServer(),
      )
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Profile post 1',
          contentType: 'text',
        })
        .expect(201);

      const firstPostId = firstPostResponse.body.id;

      // Create comment on first post
      const firstCommentResponse = await request(
        app.getHttpServer(),
      )
        .post(`/posts/${firstPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Profile comment 1',
        })
        .expect(201);

      const firstCommentId = firstCommentResponse.body.id;

      // Create second post
      const secondPostResponse = await request(
        app.getHttpServer(),
      )
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Profile post 2',
          contentType: 'text',
        })
        .expect(201);

      const secondPostId = secondPostResponse.body.id;

      // Create second comment
      const secondCommentResponse = await request(
        app.getHttpServer(),
      )
        .post(`/posts/${secondPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Profile comment 2',
        })
        .expect(201);

      const secondCommentId = secondCommentResponse.body.id;

      // Get profile
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}/profile`)
        .expect(200);

      // Basic user information
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty(
        'username',
        username,
      );

      // Statistics
      expect(response.body.total_posts_created).toBe(2);
      expect(response.body.total_comments_made).toBe(2);

      // Recent actions
      expect(response.body).toHaveProperty('recent_actions');
      expect(response.body.recent_actions).toHaveLength(4);

      const actions = response.body.recent_actions;

      // All actions belong to the same user
      expect(
        actions.every((action: any) =>
          ['post', 'comment'].includes(action.type),
        ),
      ).toBe(true);

      // Both action types must exist
      expect(
        actions.some((action: any) => action.type === 'post'),
      ).toBe(true);

      expect(
        actions.some((action: any) => action.type === 'comment'),
      ).toBe(true);

      // All created actions should be present
      expect(
        actions.some(
          (action: any) =>
            action.type === 'post' &&
            action.id === firstPostId,
        ),
      ).toBe(true);

      expect(
        actions.some(
          (action: any) =>
            action.type === 'post' &&
            action.id === secondPostId,
        ),
      ).toBe(true);

      expect(
        actions.some(
          (action: any) =>
            action.type === 'comment' &&
            action.id === firstCommentId,
        ),
      ).toBe(true);

      expect(
        actions.some(
          (action: any) =>
            action.type === 'comment' &&
            action.id === secondCommentId,
        ),
      ).toBe(true);

      // Actions should be sorted newest first
      for (let i = 1; i < actions.length; i++) {
        expect(
          new Date(actions[i - 1].createdAt).getTime(),
        ).toBeGreaterThanOrEqual(
          new Date(actions[i].createdAt).getTime(),
        );
      }

      // Maximum of 5 recent actions
      expect(actions.length).toBeLessThanOrEqual(5);
    });

    it('should return 404 for a non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/999999/profile')
        .expect(404);
    });
  });
});

describe('Post Rate Limit (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts rate limit', () => {
    it('should return 429 after exceeding the post creation limit', async () => {
      const username = `ratelimituser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // First 5 requests should succeed
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: `Rate limit test post ${i}`,
            contentType: 'text',
          })
          .expect(201);
      }

      // 6th request should be rejected
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This post should be rate limited',
          contentType: 'text',
        })
        .expect(429);

      expect(response.body).toHaveProperty('statusCode', 429);
      expect(response.body.message).toContain(
        'Post creation rate limit exceeded',
      );
    });
  });
});

describe('Feed Cache Invalidation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /posts cache invalidation', () => {
    it('should invalidate the feed cache after creating a post', async () => {
      const username = `cacheuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const password = 'TestPassword123';

      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
        })
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username,
          password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // First feed request creates the cache
      const firstFeedResponse = await request(
        app.getHttpServer(),
      )
        .get('/posts')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      const initialTotalItems =
        firstFeedResponse.body.pagination.totalItems;

      // Create a new post
      const postResponse = await request(
        app.getHttpServer(),
      )
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Cache invalidation test post',
          contentType: 'text',
        })
        .expect(201);

      const newPostId = postResponse.body.id;

      // Feed should be fetched again after cache invalidation
      const secondFeedResponse = await request(
        app.getHttpServer(),
      )
        .get('/posts')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(
        secondFeedResponse.body.pagination.totalItems,
      ).toBe(initialTotalItems + 1);

      expect(secondFeedResponse.body.items[0]).toHaveProperty(
        'id',
        newPostId,
      );

      expect(secondFeedResponse.body.items[0]).toHaveProperty(
        'content',
        'Cache invalidation test post',
      );
    });
  });
});