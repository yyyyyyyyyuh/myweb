# 动作检测训练页面（靠墙下蹲）

一个最小可运行的前端页面，直接使用浏览器摄像头 + MediaPipe Pose Landmarker 实现：

- 实时姿态关键点与骨架绘制
- 靠墙下蹲动作分析（膝角、髋位、躯干竖直、大腿水平、左右对称）
- 实时纠错提示
- 标准姿势保持计时

## 运行方式

> 建议通过本地静态服务器启动，避免浏览器对 `file://` 的模块加载限制。

```bash
python3 -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

## 依赖说明

- 无需 npm 安装。
- 页面通过 CDN 引入：
  - `@mediapipe/tasks-vision`
  - Pose Landmarker 模型文件

## 文件说明

- `index.html`：页面结构与训练信息展示。
- `styles.css`：页面样式。
- `app.js`：摄像头、姿态检测、靠墙下蹲分析、计时与提示逻辑。
