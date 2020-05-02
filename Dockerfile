# build front-end
FROM node:latest as frontend-builder
COPY ./src/frontend /frontend
WORKDIR /frontend
RUN yarn && \
    yarn build && \
    find . -name "*.map" -type f -delete

# build back-end
FROM node:latest

ENV DATA_DIRECTORY=/config

RUN mkdir -p /opt/ffmpeg && \
    cd /opt/ffmpeg && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz --output ffmpeg.tar.xz && \
    tar --strip-components=1 -xf ffmpeg.tar.xz && \
    ln -s /opt/ffmpeg/ffmpeg /usr/bin/ffmpeg && \
    ln -s /opt/ffmpeg/ffprobe /usr/bin/ffprobe && \
    rm ffmpeg.tar.xz

COPY ./src/backend /opt/server
COPY --from=frontend-builder /frontend/build /opt/server/ui

RUN cd /opt/server && npm install

WORKDIR /opt/server
ENTRYPOINT [ "node", "main.js" ]
EXPOSE 4300
VOLUME [ "/config" ]
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "curl", "--fail", "http://localhost:4300/api/v1/healthcheck" ]