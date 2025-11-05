// 全局变量
let canvas, ctx;
let image = null;
let originalImageFile = null; // 保存原始文件
let texts = [];
let selectedText = null;
let isDragging = false;
let dragStartX, dragStartY;
let bgDragMode = false;
let imageOffsetX = 0;
let imageOffsetY = 0;
let scale = 1;
const $ = (id) => document.getElementById(id);

// 文字对象类
class TextObject {
    constructor(x, y) {
        this.id = Date.now() + Math.random();
        this.x = x;
        this.y = y;

        // 获取当前时间并格式化
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.content = `${year}.${month}.${day} ${hours}:${minutes}`;

        this.fontSize = 9;
        this.fontFamily = 'MiSans Latin';
        this.color = '#ffffff';
        this.opacity = 1;
        this.letterSpacing = 1;
    }

    draw(context, scale = 1) {
        context.save();

        context.globalAlpha = this.opacity;
        context.font = `${this.fontSize * scale}px ${this.fontFamily}`;
        context.fillStyle = this.color;
        context.textBaseline = 'middle';

        // 使用缩放后的坐标
        const displayX = this.x * scale;
        const displayY = this.y * scale;
        const displayLetterSpacing = this.letterSpacing * scale;

        // 绘制带字间距的文字
        if (this.letterSpacing !== 0) {
            let currentX = displayX;
            for (let i = 0; i < this.content.length; i++) {
                context.fillText(this.content[i], currentX, displayY);
                currentX += context.measureText(this.content[i]).width + displayLetterSpacing;
            }
        } else {
            context.fillText(this.content, displayX, displayY);
        }

        // 如果被选中，绘制边框
        if (this === selectedText) {
            const metrics = this.getMetrics(context, scale);
            context.strokeStyle = '#667eea';
            context.lineWidth = 2;
            context.setLineDash([5, 5]);
            context.strokeRect(
                metrics.left - 5,
                metrics.top - 5,
                metrics.width + 10,
                metrics.height + 10
            );
        }

        context.restore();
    }

    getMetrics(context, scale = 1) {
        context.font = `${this.fontSize * scale}px ${this.fontFamily}`;
        let width;
        if (this.letterSpacing !== 0) {
            width = 0;
            for (let i = 0; i < this.content.length; i++) {
                width += context.measureText(this.content[i]).width;
                if (i < this.content.length - 1) {
                    width += this.letterSpacing * scale;
                }
            }
        } else {
            width = context.measureText(this.content).width;
        }

        const height = this.fontSize * scale * 1.2;
        const displayX = this.x * scale;
        const displayY = this.y * scale;

        return {
            left: displayX,
            top: displayY - height / 2,
            width: width,
            height: height
        };
    }

    containsPoint(x, y, context, scale = 1) {
        const metrics = this.getMetrics(context, scale);
        return x >= metrics.left && x <= metrics.left + metrics.width &&
               y >= metrics.top && y <= metrics.top + metrics.height;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    canvas = $('canvas');
    ctx = canvas.getContext('2d');

    // 图片上传
    $('imageInput').addEventListener('change', handleImageUpload);

    // 按钮事件
    $('addTextBtn').addEventListener('click', addText);
    $('deleteTextBtn').addEventListener('click', deleteSelectedText);
    $('downloadBtn').addEventListener('click', downloadImage);
    $('resetBtn').addEventListener('click', reset);
    $('saveSettingsBtn').addEventListener('click', saveSettings);

    // 文字控制
    $('textContent').addEventListener('input', updateTextContent);
    $('posX').addEventListener('input', updatePosX);
    $('posY').addEventListener('input', updatePosY);
    $('fontFamily').addEventListener('change', updateFontFamily);
    $('fontSize').addEventListener('input', updateFontSize);
    $('letterSpacing').addEventListener('input', updateLetterSpacing);
    $('textColor').addEventListener('change', updateTextColor);
    $('opacity').addEventListener('input', updateOpacity);

    // 调整按钮
    $('posXMinus').addEventListener('click', () => adjustValue('posX', -1));
    $('posXPlus').addEventListener('click', () => adjustValue('posX', 1));
    $('posYMinus').addEventListener('click', () => adjustValue('posY', -1));
    $('posYPlus').addEventListener('click', () => adjustValue('posY', 1));
    $('fontSizeMinus').addEventListener('click', () => adjustValue('fontSize', -1));
    $('fontSizePlus').addEventListener('click', () => adjustValue('fontSize', 1));
    $('letterSpacingMinus').addEventListener('click', () => adjustValue('letterSpacing', -1));
    $('letterSpacingPlus').addEventListener('click', () => adjustValue('letterSpacing', 1));

    // Canvas 鼠标事件
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseUp);

    // Canvas 触摸事件
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });

    // 尝试加载保存的设置
    loadSettings();
});

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 保存原始文件
    originalImageFile = file;

    const reader = new FileReader();
    reader.onload = function(event) {
        image = new Image();
        image.onload = function() {
            imageOffsetX = 0;
            imageOffsetY = 0;
            texts = [];
            selectedText = null;

            resizeCanvas();
            render();

            $('uploadSection').style.display = 'none';
            $('editorSection').style.display = 'block';
        };
        image.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 调整画布大小
function resizeCanvas() {
    if (!image) return;

    const maxWidth = Math.min(window.innerWidth - 40, 1000);
    const maxHeight = window.innerHeight * 0.7;

    let width = image.width;
    let height = image.height;

    if (width > maxWidth) {
        scale = maxWidth / width;
        width = maxWidth;
        height = image.height * scale;
    }

    if (height > maxHeight) {
        scale = maxHeight / image.height;
        height = maxHeight;
        width = image.width * scale;
    }

    canvas.width = width;
    canvas.height = height;
}

// 渲染画布
function render() {
    if (!image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制图片
    ctx.drawImage(
        image,
        imageOffsetX,
        imageOffsetY,
        canvas.width,
        canvas.height
    );

    // 绘制所有文字（传入缩放比例）
    texts.forEach(text => text.draw(ctx, scale));
}

// 添加文字
function addText() {
    // 使用实际图片像素坐标（中心点）
    const text = new TextObject(image.width / 2, image.height / 2);

    // 根据图片宽度自动应用预设
    if (image.width < 2000) {
        // 小图预设
        text.x = 928;
        text.y = 2207;
        text.fontSize = 32;
        text.fontFamily = 'MiSans Latin';
        text.color = '#ffffff';
        text.opacity = 1;
        text.letterSpacing = 3;
    } else {
        // 大图预设
        text.x = 1674;
        text.y = 3975;
        text.fontSize = 64;
        text.fontFamily = 'MiSans Latin';
        text.color = '#ffffff';
        text.opacity = 1;
        text.letterSpacing = 2;
    }

    // 如果有保存的设置，优先使用保存的设置
    const savedSettings = loadSettings();
    if (savedSettings) {
        text.x = savedSettings.x || text.x;
        text.y = savedSettings.y || text.y;
        text.fontSize = savedSettings.fontSize || text.fontSize;
        text.fontFamily = savedSettings.fontFamily || text.fontFamily;
        text.color = savedSettings.color || text.color;
        text.opacity = savedSettings.opacity || text.opacity;
        text.letterSpacing = savedSettings.letterSpacing !== undefined ? savedSettings.letterSpacing : text.letterSpacing;
    }

    texts.push(text);
    selectedText = text;
    updateControlPanel();
    render();
}

// 删除选中的文字
function deleteSelectedText() {
    if (selectedText) {
        texts = texts.filter(t => t !== selectedText);
        selectedText = null;
        updateControlPanel();
        render();
    }
}

// 下载图片
async function downloadImage() {
    // 创建一个临时画布，使用原始图片尺寸
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 绘制原始尺寸的图片
    tempCtx.drawImage(image, 0, 0, image.width, image.height);

    // 绘制所有文字（不需要缩放，因为坐标已经是实际像素）
    texts.forEach(text => {
        tempCtx.save();

        tempCtx.globalAlpha = text.opacity;
        tempCtx.font = `${text.fontSize}px ${text.fontFamily}`;
        tempCtx.fillStyle = text.color;
        tempCtx.textBaseline = 'middle';

        // 使用实际像素坐标
        if (text.letterSpacing !== 0) {
            let currentX = text.x;
            for (let i = 0; i < text.content.length; i++) {
                tempCtx.fillText(text.content[i], currentX, text.y);
                currentX += tempCtx.measureText(text.content[i]).width + text.letterSpacing;
            }
        } else {
            tempCtx.fillText(text.content, text.x, text.y);
        }

        tempCtx.restore();
    });

    // 检测原始文件格式并使用合适的导出格式
    let mimeType = 'image/png';
    let quality = 1.0;
    let extension = 'png';

    if (originalImageFile) {
        const fileType = originalImageFile.type;
        // 如果是 JPEG，保持 JPEG 格式以减小文件大小
        if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
            mimeType = 'image/jpeg';
            quality = 0.95; // 高质量 JPEG，几乎无损但体积小很多
            extension = 'jpg';
        } else if (fileType === 'image/webp') {
            mimeType = 'image/webp';
            quality = 0.95;
            extension = 'webp';
        }
    }

    // 使用 blob 方式导出
    tempCanvas.toBlob(async (blob) => {
        try {
            let finalBlob = blob;

            // 只对 JPEG 格式修改 EXIF（PNG 和 WebP 不支持标准 EXIF）
            if (mimeType === 'image/jpeg' && typeof piexif !== 'undefined') {
                finalBlob = await modifyExifData(blob);
            }

            // 使用 blob 下载
            const url = URL.createObjectURL(finalBlob);
            const link = document.createElement('a');
            link.download = `watermarked-${Date.now()}.${extension}`;
            link.href = url;
            link.click();

            // 释放 URL 对象
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请重试');
        }
    }, mimeType, quality);
}

// 修改 EXIF 数据
async function modifyExifData(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const dataUrl = e.target.result;

                // 从文字内容中解析时间，如果解析失败则使用当前时间
                const dateTime = parseDateTime();

                // 读取原始 EXIF（如果存在）
                let exifObj = {};
                try {
                    exifObj = piexif.load(dataUrl);
                } catch (err) {
                    // 如果没有 EXIF 数据，创建新的
                    exifObj = {
                        "0th": {},
                        "Exif": {},
                        "GPS": {},
                        "Interop": {},
                        "1st": {},
                        "thumbnail": null
                    };
                }

                // 修改时间相关的 EXIF 标签
                // DateTime: 文件修改时间
                exifObj['0th'][piexif.ImageIFD.DateTime] = dateTime;

                // DateTimeOriginal: 原始拍摄时间
                exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal] = dateTime;

                // DateTimeDigitized: 数字化时间
                exifObj['Exif'][piexif.ExifIFD.DateTimeDigitized] = dateTime;

                // 可选：添加其他 EXIF 信息（目前注释掉）
                // exifObj['0th'][piexif.ImageIFD.Make] = 'WatermarkEditor'; // 制造商
                // exifObj['0th'][piexif.ImageIFD.Model] = 'v1.0'; // 型号
                // exifObj['0th'][piexif.ImageIFD.Software] = 'Photo Watermark Editor'; // 软件
                // exifObj['Exif'][piexif.ExifIFD.UserComment] = 'Edited with watermark'; // 用户注释

                // 可选：GPS 信息（需要额外实现）
                // exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = [[22, 1], [32, 1], [0, 1]];
                // exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = 'N';
                // exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = [[114, 1], [10, 1], [0, 1]];
                // exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = 'E';

                // 可选：相机设置信息
                // exifObj['Exif'][piexif.ExifIFD.FNumber] = [28, 10]; // 光圈 f/2.8
                // exifObj['Exif'][piexif.ExifIFD.ExposureTime] = [1, 100]; // 快门速度 1/100s
                // exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings] = 100; // ISO
                // exifObj['Exif'][piexif.ExifIFD.FocalLength] = [50, 1]; // 焦距 50mm

                // 将修改后的 EXIF 数据插入图片
                const exifBytes = piexif.dump(exifObj);
                const newDataUrl = piexif.insert(exifBytes, dataUrl);

                // 将 base64 转换为 blob
                const base64Data = newDataUrl.split(',')[1];
                const binaryData = atob(base64Data);
                const arrayBuffer = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    arrayBuffer[i] = binaryData.charCodeAt(i);
                }

                const newBlob = new Blob([arrayBuffer], { type: 'image/jpeg' });
                resolve(newBlob);
            } catch (error) {
                console.error('EXIF 修改失败:', error);
                // 如果修改失败，返回原始 blob
                resolve(blob);
            }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(blob);
    });
}

// 从文字内容解析日期时间，如果无法解析则返回当前时间
function parseDateTime() {
    // EXIF 时间格式: "YYYY:MM:DD HH:mm:ss"

    // 尝试从第一个文字对象获取内容
    if (texts.length === 0) {
        return getCurrentDateTime();
    }

    const textContent = texts[0].content;

    // 尝试解析 "2025.11.03 12:00" 格式
    const pattern1 = /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/;
    const match1 = textContent.match(pattern1);
    if (match1) {
        return `${match1[1]}:${match1[2]}:${match1[3]} ${match1[4]}:${match1[5]}:00`;
    }

    // 尝试解析 "2025-11-03 12:00" 格式
    const pattern2 = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/;
    const match2 = textContent.match(pattern2);
    if (match2) {
        return `${match2[1]}:${match2[2]}:${match2[3]} ${match2[4]}:${match2[5]}:00`;
    }

    // 尝试解析 "2025/11/03 12:00" 格式
    const pattern3 = /(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/;
    const match3 = textContent.match(pattern3);
    if (match3) {
        return `${match3[1]}:${match3[2]}:${match3[3]} ${match3[4]}:${match3[5]}:00`;
    }

    // 如果无法解析，返回当前时间
    return getCurrentDateTime();
}

// 获取当前时间，格式化为 EXIF 时间格式
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

// 重置
function reset() {
    image = null;
    texts = [];
    selectedText = null;
    imageOffsetX = 0;
    imageOffsetY = 0;
    bgDragMode = false;

    $('uploadSection').style.display = 'block';
    $('editorSection').style.display = 'none';
    $('imageInput').value = '';
}

// 更新控制面板
function updateControlPanel() {
    const panel = $('textControls');

    if (selectedText) {
        panel.style.display = 'block';
        $('textContent').value = selectedText.content;

        // 更新位置控件的最大值（使用实际图片像素）
        $('posX').max = image.width;
        $('posY').max = image.height;

        // 更新位置值（显示实际像素坐标）
        $('posX').value = Math.round(selectedText.x);
        $('posXValue').textContent = Math.round(selectedText.x);
        $('posY').value = Math.round(selectedText.y);
        $('posYValue').textContent = Math.round(selectedText.y);

        $('fontFamily').value = selectedText.fontFamily;
        $('fontSize').value = selectedText.fontSize;
        $('fontSizeValue').textContent = selectedText.fontSize;
        $('letterSpacing').value = selectedText.letterSpacing;
        $('letterSpacingValue').textContent = selectedText.letterSpacing;
        $('textColor').value = selectedText.color;
        $('opacity').value = selectedText.opacity * 100;
        $('opacityValue').textContent = Math.round(selectedText.opacity * 100);
    } else {
        panel.style.display = 'none';
    }
}

// 文字控制更新函数
function updateTextContent(e) {
    if (selectedText) {
        selectedText.content = e.target.value;
        render();
    }
}

function updateFontFamily(e) {
    if (selectedText) {
        selectedText.fontFamily = e.target.value;
        render();
    }
}

function updateFontSize(e) {
    if (selectedText) {
        selectedText.fontSize = parseInt(e.target.value);
        $('fontSizeValue').textContent = e.target.value;
        render();
    }
}

function updateLetterSpacing(e) {
    if (selectedText) {
        selectedText.letterSpacing = parseInt(e.target.value);
        $('letterSpacingValue').textContent = e.target.value;
        render();
    }
}

function updateTextColor(e) {
    if (selectedText) {
        selectedText.color = e.target.value;
        render();
    }
}

function updateOpacity(e) {
    if (selectedText) {
        selectedText.opacity = e.target.value / 100;
        $('opacityValue').textContent = e.target.value;
        render();
    }
}

function updatePosX(e) {
    if (selectedText) {
        selectedText.x = parseInt(e.target.value);
        $('posXValue').textContent = e.target.value;
        render();
    }
}

function updatePosY(e) {
    if (selectedText) {
        selectedText.y = parseInt(e.target.value);
        $('posYValue').textContent = e.target.value;
        render();
    }
}

// 调整数值的通用函数
function adjustValue(controlId, delta) {
    const input = $(controlId);
    const currentValue = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);
    const newValue = Math.max(min, Math.min(max, currentValue + delta));

    input.value = newValue;

    // 触发 input 事件
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
}

// 保存设置到 localStorage
function saveSettings() {
    if (!selectedText) return;

    const settings = {
        x: selectedText.x,
        y: selectedText.y,
        fontSize: selectedText.fontSize,
        fontFamily: selectedText.fontFamily,
        color: selectedText.color,
        opacity: selectedText.opacity,
        letterSpacing: selectedText.letterSpacing
    };

    localStorage.setItem('watermarkSettings', JSON.stringify(settings));

    // 显示保存成功提示
    const btn = $('saveSettingsBtn');
    const originalText = btn.textContent;
    btn.textContent = '保存成功！';
    btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1500);
}

// 从 localStorage 加载设置
function loadSettings() {
    const saved = localStorage.getItem('watermarkSettings');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load settings:', e);
            return null;
        }
    }
    return null;
}

// 获取Canvas坐标
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// 鼠标事件处理
function handleCanvasMouseDown(e) {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // 检查是否点击了文字
    for (let i = texts.length - 1; i >= 0; i--) {
        if (texts[i].containsPoint(coords.x, coords.y, ctx, scale)) {
            selectedText = texts[i];
            isDragging = true;
            // 计算拖动偏移（显示坐标）
            dragStartX = coords.x - selectedText.x * scale;
            dragStartY = coords.y - selectedText.y * scale;
            updateControlPanel();
            render();
            return;
        }
    }
    // 没有点击任何文字，取消选择
    selectedText = null;
    updateControlPanel();
    render();
}

function handleCanvasMouseMove(e) {
    if (!isDragging || !selectedText) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // 计算实际像素坐标
    selectedText.x = (coords.x - dragStartX) / scale;
    selectedText.y = (coords.y - dragStartY) / scale;

    // 限制在图片范围内
    selectedText.x = Math.max(0, Math.min(image.width, selectedText.x));
    selectedText.y = Math.max(0, Math.min(image.height, selectedText.y));

    updateControlPanel();
    render();
}

function handleCanvasMouseUp(e) {
    isDragging = false;
}

// 触摸事件处理
function handleCanvasTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const coords = getCanvasCoords(touch.clientX, touch.clientY);

        for (let i = texts.length - 1; i >= 0; i--) {
            if (texts[i].containsPoint(coords.x, coords.y, ctx, scale)) {
                selectedText = texts[i];
                isDragging = true;
                dragStartX = coords.x - selectedText.x * scale;
                dragStartY = coords.y - selectedText.y * scale;
                updateControlPanel();
                render();
                return;
            }
        }
        selectedText = null;
        updateControlPanel();
        render();
    }
}

function handleCanvasTouchMove(e) {
    e.preventDefault();
    if (!isDragging || e.touches.length !== 1 || !selectedText) return;

    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);

    // 计算实际像素坐标
    selectedText.x = (coords.x - dragStartX) / scale;
    selectedText.y = (coords.y - dragStartY) / scale;

    // 限制在图片范围内
    selectedText.x = Math.max(0, Math.min(image.width, selectedText.x));
    selectedText.y = Math.max(0, Math.min(image.height, selectedText.y));

    updateControlPanel();
    render();
}

function handleCanvasTouchEnd(e) {
    e.preventDefault();
    isDragging = false;
}

// 窗口大小改变时重新调整
window.addEventListener('resize', function() {
    if (image) {
        resizeCanvas();
        render();
    }
});
