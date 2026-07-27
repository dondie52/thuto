FROM node:20-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    openssh-client \
    python3 \
    make \
    g++ \
    ripgrep \
    tmux \
  && rm -rf /var/lib/apt/lists/*
