module.exports = {
  apps: [{
    name:           'sautaladhan-backend',
    script:         'server.js',
    instances:      1,        // ← changed from 2
    exec_mode:      'cluster',
    watch:          false,
    max_memory_restart: '500M',
    env_production: { NODE_ENV: 'production' },
    error_file:     '/var/log/sautaladhan/err.log',
    out_file:       '/var/log/sautaladhan/out.log',
    merge_logs:     true,
    log_date_format:'YYYY-MM-DD HH:mm:ss',
  }],
};
