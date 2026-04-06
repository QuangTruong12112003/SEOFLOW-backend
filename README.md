# SEOFLOW Backend

## 📋 Mô tả dự án

SEOFLOW là một nền tảng quản lý dự án SEO toàn diện, tích hợp với Google Search Console, cho phép đội ngũ quản lý workflow phức tạp, theo dõi analytics thời gian thực, và cộng tác trên các task với hệ thống phân quyền dựa trên vai trò.

## 🚀 Tính năng chính

- **Quản lý dự án phân cấp**: Dự án → Workflow → Task với trạng thái tự động cập nhật
- **Tích hợp Google Search Console**: Đồng bộ dữ liệu hàng ngày (clicks, impressions, CTR, top queries, top pages)
- **Hệ thống thông báo tự động**: Cảnh báo deadline qua email và in-app
- **Phân quyền RBAC**: Vai trò Admin, SEO Manager, SEO Specialist, Content Manager với quyền tùy chỉnh theo dự án
- **Quản lý team và task assignment**: Gán task cho thành viên, theo dõi tiến độ
- **Báo cáo và analytics**: Tạo báo cáo dự án, workflow, task với dữ liệu SEO
- **Tích hợp công cụ và trường tùy chỉnh**: Quản lý tool, field, checklist tài liệu
- **Tự động hóa**: Cron jobs cho đồng bộ GSC, kiểm tra deadline, xóa user không hoạt động

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js + Express.js
- **Database**: MySQL với Sequelize ORM
- **Caching**: Redis
- **Authentication**: JWT (RS256) + Google OAuth 2.0
- **Security**: BCrypt hashing, Role-Based Access Control
- **Scheduling**: node-cron cho các tác vụ tự động
- **File Upload**: Multer với wrapper tùy chỉnh
- **Email**: Nodemailer với Gmail
- **Timezone**: dayjs với hỗ trợ UTC+7

## 🏗️ Kiến trúc và điểm mạnh

- **MVC Pattern**: Tách biệt rõ ràng giữa Models (25+ entities), Controllers, Routers
- **Middleware tái sử dụng**: Authentication, authorization, upload, email
- **Database transactions**: Đảm bảo tính nhất quán dữ liệu trong các thao tác phức tạp
- **State machine**: Quản lý trạng thái task/workflow/project với cascading updates
- **Third-party integrations**: Google Search Console API, Google Generative AI
- **Automated workflows**: 3 cron jobs cho đồng bộ dữ liệu và maintenance
- **Security best practices**: Asymmetric encryption, proper error handling, CORS
- **Scalability**: Multi-tenant support, optimized queries, Redis caching

## 💡 Lợi ích và điểm mạnh cho CV/Phỏng vấn

- **Kiến trúc doanh nghiệp**: Thiết kế production-ready với patterns phức tạp như state machines, cascading updates
- **Tích hợp API nâng cao**: OAuth 2.0 flow với refresh tokens, scheduled data sync
- **Business logic tinh vi**: Quản lý workflow SEO, analytics real-time, permission systems
- **Automation & Reliability**: Cron jobs, transactions, error handling robust
- **Security awareness**: JWT RS256, bcrypt, RBAC với granular permissions
- **Data engineering**: 25+ models interconnected, normalization, indexing
- **Team collaboration features**: Multi-user assignments, comments, notifications
- **Performance optimization**: Lazy loading, caching, async operations

## 📊 Thống kê dự án

- **25+ Models** với relationships phức tạp
- **20+ Route groups** (60+ endpoints)
- **18+ Controllers** xử lý business logic
- **8+ Middleware** cho authentication, upload, email
- **3 Cron jobs** tự động
- **Dual authentication** (JWT + OAuth)

## 🔧 Cài đặt và chạy

1. Clone repository
2. `npm install`
3. Cấu hình .env (database, JWT keys, Google OAuth, Redis)
4. `npm start` hoặc `node app.js`

## 🤝 Đóng góp

Dự án này thể hiện khả năng xây dựng backend phức tạp với integrations thực tế, phù hợp cho portfolio và CV trong lĩnh vực full-stack development.
