module.exports = {
  apps: [{
    name:           'azantime-backend',
    script:         'server.js',
    instances:      2,
    exec_mode:      'cluster',
    watch:          false,
    max_memory_restart: '500M',
    env_production: { NODE_ENV: 'production' },
    error_file:     '/var/log/azantime/err.log',
    out_file:       '/var/log/azantime/out.log',
    merge_logs:     true,
    log_date_format:'YYYY-MM-DD HH:mm:ss',
  }],
};
