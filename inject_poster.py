import base64
import re
import mimetypes
import os

def inject_base64_poster():
    filepath = "assets/poster.jpg"
    
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return

    # Guess MIME type
    mime_type, _ = mimetypes.guess_type(filepath)
    if not mime_type:
        mime_type = "image/jpeg"

    # Encode to Base64
    with open(filepath, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        data_url = f"data:{mime_type};base64,{encoded_string}"

    # Read index.html
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # Replace the existing src
    # This regex will match either src="assets/poster.jpg" or an existing base64 string
    # Because replacing a huge base64 string via regex might cause memory issues, we'll just look for the ID
    pattern = r'(id="poster-bg-img" src=")(.*?)(")'
    new_content = re.sub(pattern, r'\g<1>' + data_url + r'\g<3>', content)

    # Write back to index.html
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(new_content)

    print("Success: Base64 injection complete. index.html updated.")

if __name__ == "__main__":
    inject_base64_poster()
