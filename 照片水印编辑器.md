# 照片水印编辑器

一个纯前端的照片水印编辑工具，支持添加文字水印、精确定位、EXIF 信息修改等功能。

## 主要功能

### 1. 图片上传与编辑
- 支持上传 JPG、PNG、WebP 等常见图片格式
- 自适应显示，支持桌面端和移动端
- 保持原图分辨率，导出时不损失画质

### 2. 文字水印
- **自动时间水印**：添加文字时自动获取当前时间（格式：2025.11.03 14:30）
- **多文字支持**：可添加多个文字水印
- **拖动定位**：支持鼠标和触摸拖动调整位置
- **精确坐标**：通过 X/Y 坐标输入框精确定位（单位：实际像素）

### 3. 文字属性设置
- **字体**：7种系统字体选择（包含 MiSans Latin、微软雅黑、黑体等）
- **字号**：6-80px 可调
- **字间距**：-10px 到 50px 可调
- **颜色**：支持任意颜色选择
- **透明度**：0-100% 可调

### 4. 坐标系统
- 使用**实际图片像素**作为坐标单位
- 所有设备显示的坐标值统一
- 例如：1200x2200 的图片，X 坐标范围 0-1200，Y 坐标范围 0-2200
- 显示时自动缩放，但坐标值始终保持不变

### 5. 智能预设
根据图片宽度自动应用合适的预设：

#### 小图预设（宽度 < 2000px）
```json
{
  "x": 928,
  "y": 2207,
  "fontSize": 32,
  "letterSpacing": 3
}
```

#### 大图预设（宽度 ≥ 2000px）
```json
{
  "x": 1674,
  "y": 3975,
  "fontSize": 64,
  "letterSpacing": 2
}
```

### 6. 设置保存
- 点击"保存设置"保存当前文字的所有属性
- 使用 localStorage 本地存储，浏览器关闭后仍保留
- 下次添加文字时自动应用保存的设置
- 只需修改文字内容即可快速批量处理

### 7. 导出优化
- **格式保持**：JPEG 导出为 JPEG，PNG 导出为 PNG
- **质量控制**：JPEG 使用 95% 高质量压缩，体积小但几乎无损
- **Blob 下载**：使用 Blob 方式下载，更高效
- **原始分辨率**：导出图片保持原始尺寸和画质

### 8. EXIF 信息修改（仅 JPEG）
自动修改照片的 EXIF 元数据：

#### 时间信息
- **自动解析**：从文字内容中解析时间
  - 支持格式：`2025.11.03 12:00`、`2025-11-03 12:00`、`2025/11/03 12:00`
  - 如果无法解析，使用当前系统时间
- **修改字段**：
  - `DateTime`：文件修改时间
  - `DateTimeOriginal`：原始拍摄时间
  - `DateTimeDigitized`：数字化时间

#### 其他可选信息（已注释，可按需启用）
```javascript
// 相机信息
exifObj['0th'][piexif.ImageIFD.Make] = 'WatermarkEditor'; // 制造商
exifObj['0th'][piexif.ImageIFD.Model] = 'v1.0'; // 型号
exifObj['0th'][piexif.ImageIFD.Software] = 'Photo Watermark Editor'; // 软件

// 用户注释
exifObj['Exif'][piexif.ExifIFD.UserComment] = 'Edited with watermark';

// GPS 位置信息
exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = [[22, 1], [32, 1], [0, 1]];
exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = 'N';
exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = [[114, 1], [10, 1], [0, 1]];
exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = 'E';

// 相机设置
exifObj['Exif'][piexif.ExifIFD.FNumber] = [28, 10]; // 光圈 f/2.8
exifObj['Exif'][piexif.ExifIFD.ExposureTime] = [1, 100]; // 快门速度 1/100s
exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings] = 100; // ISO
exifObj['Exif'][piexif.ExifIFD.FocalLength] = [50, 1]; // 焦距 50mm
```

> **注意**：EXIF 修改仅对 JPEG 格式有效，PNG 和 WebP 不支持标准 EXIF。

## 使用方法

### 基本流程
1. 点击"点击上传图片"选择照片
2. 点击"添加文字"创建水印（自动应用预设）
3. 拖动文字或使用坐标调整位置
4. 根据需要调整字号、字间距等属性
5. （可选）点击"保存设置"保存当前配置
6. 点击"下载图片"导出带水印的照片

### 批量处理技巧
1. 第一张照片调整好所有参数
2. 点击"保存设置"
3. 点击"重新上传"上传下一张
4. 点击"添加文字"（自动应用之前的设置）
5. 修改文字内容为新时间
6. 下载，重复步骤 3-6

### 坐标调整技巧
- **粗调**：拖动文字大致定位
- **精调**：使用 X/Y 坐标滑块
- **微调**：使用坐标旁的 +/- 按钮（每次 ±1 像素）

## 技术特性

### 前端技术栈
- 纯 HTML5 + CSS3 + JavaScript
- Canvas API 用于图像处理
- FileReader API 用于文件读取
- Blob API 用于文件下载
- localStorage 用于设置存储

### 外部依赖
- **piexifjs**：EXIF 数据读写库
  - CDN：`https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/piexif.min.js`
  - 用途：修改 JPEG 图片的 EXIF 元数据

### 核心 API
- **Canvas API**：图像渲染和处理
- **FileReader API**：读取本地图片文件
- **Blob API**：高效文件下载
- **localStorage API**：保存用户设置

### 自定义字体
- 包含 MiSans Latin 字体文件（MiSansLatin-Regular.woff2）
- 通过 @font-face 加载，无需系统安装

### 兼容性
- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 移动端浏览器（iOS Safari、Android Chrome）
- 支持触摸操作

## 文件结构

```
photoEdit/
├── index.html              # 主页面
├── styles.css              # 样式文件
├── script.js               # 功能脚本
├── MiSansLatin-Regular.woff2  # 自定义字体
└── 照片水印编辑器.md       # 本文档
```

## 核心优势

1. **纯前端实现**：无需服务器，图片不上传，隐私安全
2. **原图画质**：保持原始分辨率和格式，不损失画质
3. **智能预设**：根据图片大小自动适配，开箱即用
4. **精确定位**：像素级坐标控制，跨设备统一
5. **EXIF 修改**：自动更新照片时间信息，满足特殊需求
6. **体积优化**：JPEG 高质量压缩，文件大小接近原图

## 常见问题

### Q: 为什么导出的图片比原图稍大？
A: 虽然保持了原始分辨率，但 Canvas 重新编码后，压缩算法可能略有不同。已使用 95% 质量的 JPEG 压缩来最小化体积增加。

### Q: PNG 图片支持 EXIF 修改吗？
A: 不支持。PNG 格式不支持标准 EXIF 元数据。只有 JPEG 格式会进行 EXIF 修改。

### Q: 如何启用其他 EXIF 信息修改？
A: 打开 `script.js`，找到 `modifyExifData` 函数，取消相关代码的注释即可。

### Q: 坐标在不同设备上不一致怎么办？
A: 新版本已修复此问题。坐标系统现在基于实际图片像素，在所有设备上显示的值都相同。

### Q: 可以添加多行文字吗？
A: 可以。点击多次"添加文字"即可创建多个独立的文字对象，每个都可以单独定位和编辑。

## 更新日志

### v1.0.0（当前版本）
- 纯前端照片水印编辑器
- 文字水印添加和编辑
- 智能预设和设置保存
- Blob 下载和 EXIF 修改
- 统一坐标系统

## 许可证

本项目仅供个人学习和使用。

## 技术支持

如有问题或建议，请查看代码注释或修改源代码。
