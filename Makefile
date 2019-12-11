img_ver=v2
img_name=pong-game

build:
	docker build -t $(img_name):$(img_ver) .
	docker image ls | grep $(img_name)

run:
	docker run -it --rm -p 27853:3000 -p 27854:3001 $(img_name):$(img_ver)

export:
	docker save -o ../$(img_name)$(img_ver).tar $(img_name):$(img_ver)

stop:
	docker rm $(docker stop $(docker ps -a -q --filter ancestor=$(img_name) --format="{{.ID}}"))