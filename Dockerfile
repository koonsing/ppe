FROM node:10

WORKDIR /usr/src/downloads
RUN wget https://github.com/libvips/libvips/releases/download/v8.9.2/vips-8.9.2.tar.gz
RUN tar xf vips-8.9.2.tar.gz
WORKDIR /usr/src/downloads/vips-8.9.2
RUN ./configure
RUN make
RUN make install
RUN ldconfig

WORKDIR /usr/src/apps

RUN npm install -g node-gyp
RUN npm install -g nodemon

COPY . .

RUN npm install sharp --build-from-source
RUN npm install

RUN mkdir -p public/video
RUN mkdir -p server/alerts
RUN mkdir -p server/alerts/cropped
RUN mkdir -p server/alerts/data
RUN mkdir -p server/alerts/inferences
RUN mkdir -p server/alerts/temp