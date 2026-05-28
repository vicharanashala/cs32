# QuoraFAQ — Implementation Status

## ✅ Done (67 features)

### Authentication & User Management
- [x] User registration (username/email/password)
- [x] User login (JWT-based)
- [x] Session persistence on page reload
- [x] Logout
- [x] Profile update (display name, bio, avatar, website, location)
- [x] User profile page (public, with stats)
- [x] User questions/answers tabs
- [x] Role badges (admin/moderator on profile)
- [x] User badge system (earned badges on profile)

### Questions
- [x] Ask question (title, body, tags)
- [x] Duplicate detection while typing title (debounced ES search)
- [x] Paginated listing with sort tabs (Newest / Active / Most Voted / Most Viewed)
- [x] Filter by tag (?tag= query param)
- [x] Question detail page (body, answers, voting, comments)
- [x] Upvote/downvote on questions and answers
- [x] Save/bookmark questions
- [x] Post answers with Markdown body
- [x] Accept answer (+15 reputation, green highlight)
- [x] Add/remove tags inline on question detail
- [x] Report duplicate (modal with ES search + reason)
- [x] Resolve duplicate (admin/moderator: close + link original)
- [x] Delete question (author or admin, soft-delete)
- [x] Real-time new answers via Socket.IO

### Comments
- [x] Nested comment threads on answers (depth up to 2)
- [x] Reply to existing comments
- [x] @mention autocomplete with keyboard navigation
- [x] Delete comment (author or admin)
- [x] Real-time new comments via Socket.IO

### Tags
- [x] Tag listing page (filterable, sorted by question count)
- [x] Tag detail page (metadata + questions list)
- [x] Tag autocomplete when adding tags to questions
- [x] Click tag badge to filter question list
- [x] Auto-upsert tags on first use (Instagram-style)

### FAQ
- [x] FAQ listing (paginated, filterable by category)
- [x] FAQ detail page with multi-item navigation
- [x] "On this page" sidebar table of contents with smooth scroll
- [x] Helpful / Not Helpful feedback per item with counts
- [x] FAQ item tags (linked to tag pages)
- [x] Official / category badges on FAQ cards

### Search
- [x] Full-text search across questions, FAQs, and users (Elasticsearch)
- [x] Type filter (All / Questions / FAQs / Users)
- [x] Trending search suggestions (Redis-cached)
- [x] Relevance scores on results

### Notifications
- [x] Notification inbox with unread count
- [x] Mark all as read
- [x] Archive individual notification
- [x] Click-to-mark-read on navigation
- [x] 10+ notification types with distinct icons
- [x] Real-time push via Socket.IO

### Admin Panel
- [x] Dashboard stats (8 metric cards)
- [x] User management (list all, change role, ban/unban with reason)
- [x] Flagged content review (questions and answers)
- [x] Clear server cache

### UI / UX
- [x] Dark mode (localStorage + prefers-color-scheme, Tailwind class strategy)
- [x] Responsive design (mobile hamburger menu, adaptive grids)
- [x] Markdown rendering (react-markdown + GFM + Tailwind Typography)
- [x] Pagination (smart sliding window)
- [x] Loading skeleton placeholders on every page
- [x] Empty states on all list pages
- [x] Toast notifications (react-hot-toast)
- [x] Inline SVG icons (no icon library dependency)
- [x] Sticky navbar and footer
- [x] Ctrl+Enter to post comments, arrow/enter/escape for mention autocomplete

### Infrastructure
- [x] JWT authentication middleware
- [x] Role-based access control (user / moderator / admin)
- [x] Elasticsearch indexing + full-text search
- [x] Redis caching (analytics, recommendations, suggestions)
- [x] Centralized API client with auto JWT injection
- [x] Socket.IO with JWT auth, per-user and per-question rooms
- [x] Multer file upload (avatar images, max 5MB)
- [x] Helmet security headers + CORS + rate limiting
- [x] Express-validator input validation
- [x] Docker / Podman deployment (multi-stage builds, compose)

---

## 📋 Pending (30 features)

### Content & Community
- [ ] **Question Following / Watching** — follow a question, get notified of new answers/edits
- [ ] **Answer Edit History** — track revisions, show diffs, moderator rollback
- [x] **Bookmarks / Collections** — organize saved questions into named folders
- [ ] **Question Bounties** — offer reputation points as bounty for answers

### User Experience
- [x] **Keyboard Shortcuts** — `Ctrl+K`/`/` search, `j`/`k` navigate, `Enter` view, `Esc` close (Yet to implement elastisearch)
- [ ] **Infinite Scroll** — Intersection Observer on question lists (with pagination fallback)
- [ ] **Rich Text Editor** — TipTap/Slate with images, code blocks, tables, preview toggle
- [ ] **Image Upload in Q&A** — upload endpoint + inline embedding in body
- [ ] **Email Notifications** — SendGrid/nodemailer for off-platform, daily digest, password reset
- [ ] **Social Login (OAuth)** — Google / GitHub as alternative to email/password

### Moderation & Admin
- [ ] **Content Flagging Workflow** — review queue with accept/reject/dismiss, flagger reputation
- [ ] **Auto-Moderation** — regex profanity/spam filter, per-user rate limits, auto-flag
- [ ] **Audit Log** — immutable log of all moderation actions (ban, delete, role change)

### Search & Discovery
- [ ] **AI-Powered Search** — LLM (OpenAI/local) + RAG pipeline for natural language answers from FAQs
- [ ] **Related Questions Widget** — tag-based or ES more-like-this on question detail page
- [ ] **Advanced Search Filters** — date range, rep filter, answer count, boolean operators

### Analytics & Insights
- [ ] **User Analytics Dashboard** — DAU, Q&A rates, top contributors, trending tags, heatmaps
- [ ] **FAQ Analytics** — most/least helpful, search terms leading to each FAQ, scroll drop-off
- [ ] **Export / Reporting** — CSV/JSON export, internship reports, scheduled email reports

### Technical Improvements
- [ ] **API Versioning** — `/api/v1/` prefix for backward compatibility
- [ ] **Rate Limiting Per User** — role-based limits (higher for mods/admins)
- [ ] **CI/CD Pipeline** — GitHub Actions for lint/test/build/deploy
- [ ] **E2E Testing** — Playwright/Cypress for critical flows
- [ ] **API Documentation** — OpenAPI/Swagger spec at `/api/docs`
- [ ] **i18n / Multi-language** — next-intl, language toggle, translated FAQ content
- [ ] **PWA Support** — service worker, offline FAQs, push notifications, add-to-homescreen
- [ ] **Webhooks** — Slack/Discord integration on events (new question, accepted answer, flagged)

### Gamification
- [ ] **Achievement Badges** — "First Question", "Helpful Hand", "Streak" — display on profile
- [ ] **Leaderboard** — weekly/monthly/all-time by reputation, separate categories
- [ ] **Reputation Scoring Tiers** — Bronze/Silver/Gold with perks, decay for inactive users
