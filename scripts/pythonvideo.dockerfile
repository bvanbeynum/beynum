FROM python:3.10

RUN echo "deb [trusted=yes] http://www.deb-multimedia.org bullseye main non-free" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get --assume-yes install deb-multimedia-keyring
RUN apt-get update
RUN apt-get install --no-install-recommends --yes build-essential gcc python3-dev mosquitto mosquitto-clients
RUN pip3 install --upgrade pip setuptools wheel
RUN apt-get --assume-yes install ffmpeg

RUN python3 -m pip install --no-cache-dir requests numpy opencv-contrib-python-headless

WORKDIR /usr/src

CMD ["python3"]


# docker run -it --rm arm64v8/python:3.7-buster bash
# apt update
# apt -y install build-essential libwrap0-dev libssl-dev libc-ares-dev uuid-dev xsltproc
# apt-get update -qq && apt-get install --no-install-recommends --yes build-essential gcc python3-dev mosquitto mosquitto-clients
# pip3 install --upgrade pip setuptools wheel
# python3 -m pip install --no-cache-dir numpy opencv-contrib-python-headless