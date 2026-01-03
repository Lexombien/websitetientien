// PM2 Ecosystem Config (CommonJS format)
// File này sẽ được tự động tạo bởi deploy.sh
// Nếu cần chỉnh sửa, copy file này và chạy: pm2 start ecosystem.config.cjs

module.exports = {
    apps: [{
        name: 'floral-backend',
        script: './server.js',
        instances: 1,
        exec_mode: 'fork',

        // Environment variables
        env: {
            NODE_ENV: 'production',
            PORT: 3001,
            HOST: '0.0.0.0'
        },

        // Logs
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Auto restart
        watch: false,
        max_memory_restart: '500M',

        // Restart on crash
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s'
    }]
}
