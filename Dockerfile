#FROM node:10

#WORKDIR /usr/src/downloads
#RUN wget https://github.com/libvips/libvips/releases/download/v8.9.2/vips-8.9.2.tar.gz
#RUN tar xf vips-8.9.2.tar.gz
#WORKDIR /usr/src/downloads/vips-8.9.2
#RUN ./configure
#RUN make
#RUN make install
#RUN ldconfig

#WORKDIR /usr/src/apps

#RUN npm install -g node-gyp
#RUN npm install -g nodemon

#COPY . .

#RUN npm install sharp --build-from-source
#RUN npm install

#RUN mkdir -p public/video
#RUN mkdir -p server/alerts
#RUN mkdir -p server/alerts/cropped
#RUN mkdir -p server/alerts/data
#RUN mkdir -p server/alerts/inferences
#RUN mkdir -p server/alerts/temp





FROM node:10

RUN apt-get update && apt-get install -y curl

RUN apt install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common

RUN curl -fsSL https://download.docker.com/linux/debian/gpg |  apt-key add -

RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian  stretch stable"  

RUN apt-get update 

RUN apt-cache policy docker-ce

RUN apt install -y  docker-ce 

RUN apt-get install -y libssl-dev  

RUN apt-get install -y  python-dev libffi-dev  gcc linux-libc-dev  make

RUN apt install -y python3-pip  

RUN pip3 install docker-compose

RUN mkdir /usr/src/apps

RUN git clone https://github.com/koonsing/ppe.git /usr/src/app

WORKDIR /usr/src/app

RUN npm install 

WORKDIR /usr/src/app/public

RUN npm install -g bower

RUN  bower install --allow-root

WORKDIR /usr/src/app

CMD ["node","server/app.js"]

