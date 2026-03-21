import base64
import re
import mimetypes
import os

def inject_avatar_base64():
    filepath = "assets/speaker.png"
    
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return

    # Guess MIME type
    mime_type, _ = mimetypes.guess_type(filepath)
    if not mime_type:
        mime_type = "image/png"

    # Encode to Base64
    with open(filepath, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        data_url = f"data:{mime_type};base64,{encoded_string}"

    # Read index.html
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # Replace the existing src for preview-avatar
    pattern1 = r'(id="preview-avatar".*?src=")(.*?)(")'
    new_content = re.sub(pattern1, r'\g<1>' + data_url + r'\g<3>', content, flags=re.DOTALL)

    # We should also replace modal-avatar-preview img
    pattern2 = r'(<div id="modal-avatar-preview".*?<img\s+src=")(.*?)(")'
    new_content = re.sub(pattern2, r'\g<1>' + data_url + r'\g<3>', new_content, flags=re.DOTALL)

    # Write back to index.html
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_content)

    print("Success: Avatar Base64 injection complete. index.html updated.")

if __name__ == "__main__":
    inject_avatar_base64()
