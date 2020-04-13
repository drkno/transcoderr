FROM node:latest

RUN mkdir -p /opt/ffmpeg && \
    cd /opt/ffmpeg && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz --output ffmpeg.tar.xz && \
    tar --strip-components=1 -xf ffmpeg.tar.xz && \
    ln -s /opt/ffmpeg/ffmpeg /usr/bin/ffmpeg && \
    ln -s /opt/ffmpeg/ffprobe /usr/bin/ffprobe && \
    rm ffmpeg.tar.xz

COPY ./src/backend /opt/server

RUN cd /opt/server && npm install

WORKDIR /opt/server
ENTRYPOINT [ "node", "main.js" ]
EXPOSE 4300
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "curl", "--fail", "http://localhost:4300/api/v1/healthcheck" ]