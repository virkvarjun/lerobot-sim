from lerobot.datasets.lerobot_dataset import LeRobotDataset
from pathlib import Path

# Path to the local dataset
local_dir = Path("/Users/arjunvirk/.cache/huggingface/lerobot/a23v/so101_test_v5")
# The repo_id we want to push to (must recall what we used locally)
repo_id = "a23v/so101_test_v5"

print(f"Loading dataset from {local_dir}...")
# Note: root argument for LeRobotDataset should be the PARENT directory of the repo folder when local
# But let's check how LeRobotDataset constructor behaves. 
# Usually it expects root to be the base cache dir, and appends repo_id.
# The folder structure is .../a23v/so101_test_v5
# So root should be .../lerobot  (inherited from HF_LEROBOT_HOME usually)

# Let's try explicit root path 
# If I pass root=Path("/Users/arjunvirk/.cache/huggingface/lerobot"), 
# it will look for root / repo_id -> .../lerobot/a23v/so101_test_v5
# This matches exactly where it is.
root_dir = Path("/Users/arjunvirk/.cache/huggingface/lerobot")

dataset = LeRobotDataset(repo_id, root=root_dir)
print(f"Pushing to Hub: {repo_id}")
dataset.push_to_hub()
print("Done!")
