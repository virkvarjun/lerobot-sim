#!/bin/bash
# Helper script to train ACT policy on success demonstrations

# Dataset: a23v/failure_recognition_success
# Robot: SO-100

source ~/miniforge3/etc/profile.d/conda.sh
conda activate lerobot

python src/lerobot/scripts/lerobot_train.py \
    --dataset.repo_id a23v/failure_recognition_success \
    --policy.type act \
    --output_dir outputs/train/act_failure_success \
    --steps 2000 \
    --policy.device mps \
    --batch_size 8 \
    --save_freq 500 \
    --log_freq 100 \
    --eval.n_episodes 0 \
    --eval.batch_size 0 \
    --policy.push_to_hub False \
    --dataset.video_backend pyav \
    --num_workers 0
