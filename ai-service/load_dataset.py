
from datasets import load_dataset
from pathlib import Path

# Folder where sample posters will be saved
output_dir = Path("sports_poster_dataset")
output_dir.mkdir(parents=True, exist_ok=True)

# Load the Hugging Face dataset in streaming mode
dataset = load_dataset(
    "creative-graphic-design/GenPoster100K",
    split="train",
    streaming=True
)

# Download and save only the first 10 poster examples
for index, example in enumerate(dataset):
    if index >= 10:
        break

    try:
        # Save the completed poster
        poster = example.get("merged_image")

        if poster is not None:
            poster.save(output_dir / f"poster_{index}.png")
            print(f"Saved poster_{index}.png")

        # Save the background separately
        background = example.get("background_image")

        if background is not None:
            background.save(
                output_dir / f"background_{index}.png"
            )

    except Exception as error:
        print(f"Could not process example {index}: {error}")

print("Dataset sample processing finished.")
