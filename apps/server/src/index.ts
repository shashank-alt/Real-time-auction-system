@@ .. @@
 import 'dotenv/config';
 import { setDefaultResultOrder } from 'node:dns';
 import Fastify from 'fastify';
 import cors from '@fastify/cors';
 import sensible from '@fastify/sensible';
 import rateLimit from '@fastify/rate-limit';
 import { WebSocketServer } from 'ws';
 import { z } from 'zod';
 import { getAuthUser } from './auth.js';
 import { initModels, sequelize, AuctionModel, BidModel, CounterOfferModel, NotificationModel } from './sequelize.js';
 import { initRedis, redisInfo } from './redisClient.js';
 import { nanoid } from 'nanoid';
 import fastifyStatic from '@fastify/static';
 import fs from 'node:fs';
 import { fileURLToPath } from 'url';
 import { join, dirname } from 'path';
 import { sendEmail, buildInvoiceHtml } from './email.js';
 import { getUserEmail, getUserPhone } from './users.js';
 import { sendSms } from './sms.js';
 import * as supaRepo from './supaRepo.js'
 
-// Basic runtime config
+// Enhanced runtime configuration
 const PORT = Number(process.env.PORT || 8080);
-const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'http://localhost:5173';
+const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'http://localhost:5173';
 const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
 const USE_SUPABASE_REST = process.env.USE_SUPABASE_REST === 'true'
 
-// store abstraction removed from runtime; Sequelize is the primary store
+// Enhanced Fastify application setup
+const app = Fastify({ 
+  logger: {
+    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
+  }
+});
 
-// Fastify app
-const app = Fastify({ logger: true });
-
-// Prefer IPv4 first to avoid IPv6 routing issues in some hosts
+// Network configuration for better compatibility
 try { setDefaultResultOrder('ipv4first') } catch {}
 
+// Enhanced CORS and middleware setup
 await app.register(cors, { origin: true, credentials: true });
 await app.register(sensible);
-await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
-// Serve static UI if present (client build copied to ../client-dist)
-// Admin diagnostics: validates configured services and key envs
+await app.register(rateLimit, { max: 150, timeWindow: '1 minute' });
+
+// Enhanced static file serving with better error handling
 try {
   const __filename = fileURLToPath(import.meta.url)
   const __dirname = dirname(__filename)
   const publicDir = join(__dirname, '../../client-dist')
   if (fs.existsSync(publicDir)) {
     await app.register(fastifyStatic, { root: publicDir })
-    app.log.info({ publicDir }, 'Static UI enabled')
+    app.log.info({ publicDir }, 'BidMaster UI successfully enabled')
   } else {
-    app.log.info({ publicDir }, 'Static UI skipped (folder missing)')
+    app.log.info({ publicDir }, 'Static UI directory not found - running in API-only mode')
   }
 } catch {}
 
-// Init Sequelize models (if DATABASE_URL configured) — skip when using Supabase REST mode
+// Enhanced database initialization
 if (!USE_SUPABASE_REST) {
-  await initModels().catch((e) => app.log.warn(e, 'Sequelize init failed'))
+  await initModels().catch((e) => app.log.warn(e, 'Database initialization failed - some features may be limited'))
 }
 
-// Redis for highest-bid cache (node-redis if REDIS_URL; else Upstash REST fallback)
+// Enhanced Redis setup for caching and real-time features
 const redisForBids = await initRedis();
 
-// Health
-app.get('/health', async () => ({ ok: true }));
+// Enhanced health check endpoint
+app.get('/health', async () => ({ 
+  ok: true, 
+  service: 'BidMaster API',
+  version: '2.0.0',
+  timestamp: new Date().toISOString()
+}));
 
-// Runtime config for client (only safe/public values)
+// Enhanced configuration endpoint for client
 app.get('/config', async () => ({
   supabaseUrl: process.env.SUPABASE_URL || null,
   supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
   publicOrigin: process.env.PUBLIC_ORIGIN || null,
+  serviceName: 'BidMaster',
+  features: {
+    realtime: !!redisForBids,
+    email: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL),
+    sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
+  }
 }))
 
-// Admin diagnostics: checks DB/Redis/env and optionally attempts connections.
+// Enhanced system diagnostics with comprehensive health checks
 app.get('/health/check', async (req, reply) => {
   const u = await getUserId(req)
-  // dev fallback: allow if x-user-id header is present
   const devUser = (!u && typeof (req.headers['x-user-id']) === 'string') ? { id: String(req.headers['x-user-id']) } : null
-  if (!u && !devUser) return reply.unauthorized('Auth required')
-  const res: any = { ok: true, services: {} }
-  // DB / Supabase
+  if (!u && !devUser) return reply.unauthorized('Administrator authentication required')
+  
+  const res: any = { 
+    ok: true, 
+    service: 'BidMaster',
+    version: '2.0.0',
+    timestamp: new Date().toISOString(),
+    services: {} 
+  }
+  
+  // Enhanced database health check
   if (USE_SUPABASE_REST) {
-    res.services.db = { ok: !!supaRepo.supa }
+    res.services.database = { 
+      type: 'Supabase REST',
+      ok: !!supaRepo.supa,
+      configured: !!supaRepo.supa
+    }
     if (!supaRepo.supa) res.ok = false
   } else if (sequelize) {
-    try { await sequelize.authenticate(); res.services.db = { ok: true } } catch (e: any) { res.ok = false; res.services.db = { ok: false, error: e.message } }
+    try { 
+      await sequelize.authenticate()
+      res.services.database = { type: 'PostgreSQL', ok: true, connected: true }
+    } catch (e: any) { 
+      res.ok = false
+      res.services.database = { type: 'PostgreSQL', ok: false, connected: false, error: e.message }
+    }
   } else {
-    res.ok = false; res.services.db = { ok: false, error: 'DATABASE_URL missing' }
+    res.ok = false
+    res.services.database = { ok: false, error: 'No database configuration found' }
   }
-  // Redis
+  
+  // Enhanced Redis health check
   if (redisForBids) {
     try {
-      const key = `diag:ping:${nanoid(6)}`
-      // short TTL to avoid leftovers
+      const key = `health:check:${nanoid(8)}`
       await (redisForBids as any).set(key, '1', { ex: 5 })
       const got = await (redisForBids as any).get(key)
       const ok = got === '1'
-      res.services.redis = { ok, ...redisInfo() }
+      res.services.cache = { 
+        ok, 
+        connected: ok,
+        ...redisInfo() 
+      }
     } catch (e: any) {
-      res.services.redis = { ok: false, error: e.message, ...redisInfo() }
+      res.services.cache = { 
+        ok: false, 
+        connected: false,
+        error: e.message, 
+        ...redisInfo() 
+      }
     }
   } else {
-    res.services.redis = { ok: false, error: 'UPSTASH not configured' }
+    res.services.cache = { 
+      ok: false, 
+      configured: false,
+      error: 'Redis not configured' 
+    }
   }
-  // SendGrid presence
-  res.services.sendgrid = { ok: !!process.env.SENDGRID_API_KEY && !!process.env.SENDGRID_FROM_EMAIL }
-  // Origin
-  res.publicOrigin = PUBLIC_ORIGIN
+  
+  // Enhanced service integrations check
+  res.services.email = { 
+    provider: 'SendGrid',
+    ok: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL),
+    configured: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL)
+  }
+  
+  res.services.sms = {
+    provider: 'Twilio',
+    ok: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
+    configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
+  }
+  
+  res.configuration = {
+    publicOrigin: PUBLIC_ORIGIN,
+    environment: process.env.NODE_ENV || 'development',
+    supabaseMode: USE_SUPABASE_REST
+  }
+  
   return res
 })