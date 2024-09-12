How to Run the Project
Steps:
1. Clone the Repository: git clone https://github.com/Ayush095/Image-Compressor.git
2. Install Dependencies: npm install
3. Run MongoDB Locally: sudo mongod --dbpath <path-to-your-data-db-folder>
4. Navigate to the src/ Directory: cd src/
5. Run the server: nodemon server.js or node server.js
6. Open Postman Collection: [POSTMAN]([url](https://www.postman.com/descent-module-technologist-29103000/imagecompressor/request/g81hv36/http-localhost-3000-status?action=share&creator=34166341&ctx=documentation))
7. POST API (Upload File): POST http://localhost:3000/upload
8. GET API (Status Check): GET http://localhost:3000/status/<request_id>

Ex- GET http://localhost:3000/status/8455200b-6fb6-4f1c-9681-724ba9a1f5a0

Documentation Of Designing: https://excalidraw.com/#json=jM9GBmGOi0H6c26RdvONt,oCuxCVgQo6qpRDYLK2SyoA
