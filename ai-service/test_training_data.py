from datasets import load_dataset
from pathlib import Path

data_dir = Path("training_data")

if not data_dir.exists():
    print(f"Error: {data_dir.resolve()} does not exist. Run prepare_training_data.py first.")
    exit(1)

print("Loading training dataset from local folder...")
dataset = load_dataset(
    "imagefolder",
    data_dir=str(data_dir),
    split="train"
)

print("-" * 50)
print("Dataset Summary:")
print("Total posters prepared:", len(dataset))
print("Available columns:", dataset.column_names)
print("First sample file:", dataset[0]["image"])
print("First sample caption:", dataset[0]["text"][:120] + "...")
print("-" * 50)
print("SUCCESS: Local training data is correctly structured and ready for model training!")
