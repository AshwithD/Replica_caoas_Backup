module.exports = {
  apps: [

    // 🔥 10 Daphne Instances
    {
      name: "daphne-8000",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8000 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8001",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8001 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8002",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8002 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8003",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8003 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8004",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8004 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8005",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8005 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8006",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8006 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8007",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8007 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8008",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8008 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },
    {
      name: "daphne-8009",
      script: "daphne",
      args: "-b 0.0.0.0 -p 8009 hrms_backend.asgi:application",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },

    // 🔧 Celery Worker
    {
      name: "celery-worker",
      script: "celery",
      args: "-A hrms_backend worker -l info -P solo",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },

    // ⏰ Celery Beat
    {
      name: "celery-beat",
      script: "celery",
      args: "-A hrms_backend beat -l info",
      cwd: "E:/Chandru Kiran/CKPSCA/hrms_backend",
      interpreter: "none"
    },

    // 🌐 React Build Serve
    {
    name: "react-app",
    script: "cmd.exe",
    args: "/c C:\\Users\\devck\\AppData\\Roaming\\npm\\serve.cmd -s build -l 3000",
    cwd: "E:/Chandru Kiran/CKPSCA/frontend",
    autorestart: true
    }

  ]
};