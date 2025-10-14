module.exports = {
  apps: [{
    name: 'ats-backend',
    script: 'server.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Environment variables
    env_file: '.env',
    
    // AWS-specific optimizations
    node_args: '--max-old-space-size=1024',
    
    // Process management
    merge_logs: true,
    time: true,
    
    // Error handling
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Memory management
    max_memory_restart: '1G',
    
    // Restart policy
    restart_delay: 4000,
    exp_backoff_restart_delay: 100
  }]
};