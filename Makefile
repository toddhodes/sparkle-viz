
.PHONEY: zip deploy deploy2 pulldata clean

zip:
	zip /tmp/sviz.zip \
		images/*.png images/*.jpg images/ui/*.png \
		css/*.css \
		js/*.js \
		data/??????????.json \
		*.html

deploy: zip
	scp /tmp/sviz.zip root@SERVER_HOST:packages/
	ssh root@SERVER_HOST mkdir -p /opt/wm/apache-tomcat-5.5.28/webapps/sviz
	ssh root@SERVER_HOST unzip packages/sviz.zip -d /opt/wm/apache-tomcat-5.5.28/webapps/sviz/

deploy2: zip
	scp /tmp/sviz.zip root@SERVER_HOST:packages/sviz2.zip
	ssh root@SERVER_HOST mkdir -p /opt/wm/apache-tomcat-5.5.28/webapps/sviz2
	ssh root@SERVER_HOST unzip packages/sviz2.zip -d /opt/wm/apache-tomcat-5.5.28/webapps/sviz2/


pulldata:
	./bin/pullLatestData.sh

clean:
	rm -f /tmp/sviz.zip
