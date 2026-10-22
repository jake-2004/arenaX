from datasets import load_dataset
from pathlib import Path
from PIL import Image
import json

DATASET_ID = "creative-graphic-design/GenPoster100K"
MAX_POSTERS = 500

output_dir = Path("training_data")
images_dir = output_dir / "images"
images_dir.mkdir(parents=True, exist_ok=True)

def get_layer_text(layers):
    texts = []

    # Handle layers represented as a list of dictionaries
    if isinstance(layers, list):
        for layer in layers:
            if isinstance(layer, dict):
                text = layer.get("text", "")
                if isinstance(text, str) and text.strip():
                    texts.append(text.strip())

    # Handle layers represented as a dictionary of lists
    elif isinstance(layers, dict):
        values = layers.get("text", [])
        if isinstance(values, str):
            values = [values]

        if isinstance(values, list):
            texts.extend(
                value.strip()
                for value in values
                if isinstance(value, str) and value.strip()
            )

    return " | ".join(texts[:10])


print("Loading GenPoster100K...")

dataset = load_dataset(
    DATASET_ID,
    split="train",
    streaming=True
)

saved = 0

with open(output_dir / "metadata.jsonl", "w", encoding="utf-8") as file:
    for example in dataset:
        image = example.get("merged_image")

        if image is None:
            continue

        try:
            image = image.convert("RGB")
            image.thumbnail((768, 768))

            filename = f"poster_{saved:04d}.jpg"
            image.save(images_dir / filename, quality=90)

            poster_text = get_layer_text(example.get("layers", {}))

            caption = "Graphic design poster"
            if poster_text:
                caption += ". Text elements: " + poster_text

            metadata = {
                "file_name": f"images/{filename}",
                "text": caption
            }

            file.write(json.dumps(metadata, ensure_ascii=False) + "\n")

            saved += 1
            print(f"Prepared {saved}/{MAX_POSTERS}")

            if saved >= MAX_POSTERS:
                break

        except Exception as error:
            print(f"Skipping poster: {error}")

print(f"Finished. Prepared {saved} posters.")
print(f"Training data folder: {output_dir.resolve()}")