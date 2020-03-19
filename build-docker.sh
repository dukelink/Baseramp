cd client
yarn build
cd ..
cd server
docker build . -t ec2-projects-2
docker tag ec2-projects-2:latest wlotherington243/ec2-projects-2:latest
docker push wlotherington243/ec2-projects-2:latest
cd ..

