import sys

from PIL import Image  # type: ignore
def process():
    # 读取原始图片并确保带有 Alpha (透明) 通道
    img = Image.open('original_speaker.jpg').convert("RGBA")
    datas = img.getdata()

    # 替换接近白色的背景为透明
    new_data = []
    for item in datas:
        # item 的格式是 (R, G, B, A)
        # 如果 RGB 均大于 240，则视为白色背景，将其透明度设为 0
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    
    # 保存处理后的图片
    output_filename = 'speaker_processed.png'
    img.save(output_filename, "PNG")
    print(f"处理完成！已保存为 {output_filename}")

if __name__ == '__main__':
    process()
