# Tricorder Bus - Powered by Transport for Edinburgh API  
A web application that makes the data made available by Transport of Edinburgh (via their open-data API) accessible using an extremely user-friendly, intuitive and responsive user interface. Tricorder Bus allows its users to: 

- Quickly search for stops by name, locality or even the services served by them.
- View the next departures for each bus service at each stop serviced by Lothian Buses, along with the full timetables. 
- Keep a list of their favourite stops so that they can easily visit them later (requires user authentication)
- View fully integrated Google Maps showing their location along with the nearby bus stops, buses and colour coded bus routes.  
- View detailed statistics of how early or late has a bus been on each of its bus stops, giving a sense of their average performance.     

Geting Started 
--------------------
All you need to get started: 

**Tools:**

1. *Node.js v0.12.2*
2. *npm* (Node package manager) 
3. *MongoDB* (NoSQL database) 
4. *express-generator* (Express.js application generator)

**Dependencies:**

 1. *Express.js* - Web Application Framework
 2. *Mocha*- JavaScript Test Framework
 3. *Swig* - JavaScript Template Engine  
 5. *Mongoose* - ODM for MongoDB
 6. *async* - Eases asynchronous control flow
 7. *moment* - Eases parsing and manipulation of JavaScript dates
 8. *bcrypt-nodejs* - Provides secure salted password hashing
 9. *session* - Helps maintain user sessions using cookies
 10. *connect-mongo* - Session store for MongoDB
 11. *node-schedule* - Eases scheduling of Node scripts
 12. *body-parser* - POST data parser 

Note that all of the above dependencies are included in `package.json` file within the root project directory. Execute the following command to install all of them in one go: 
```
$ npm install
```

There are three windows batch scripts provided:

1. `start_mongodb.bat`: starts up the MongoDB server.
2.  `start_app.bat`: starts up the app in production mode (i.e. with production database).
3. `start_app_test`: starts up the app in development mode (i.e. with test database).

Once the database and web server have started, you can start exploring the web app by visiting the following URL in your preferred browser: 

    localhost:3000


----------


Project Structure
-----------------

When you first clone the repository, the directory structure would look like this: 

    trcorder_app/
        bin/
        models/
        node_modules/
        public/
        routes/
        tests/
        utilities/
        views/
        .gitignore
        app.js
        npm-debug.log
        package.json
        start_app.bat
        start_app_test.bat
        start_mongodb.bat
        
These files/folders are: 

 - **`bin/`** directory serves as a location where you can define your various start up scripts.
 
 - **`models/`** directory consists of all the ODM models (Mongoose schemas).
   
 - **`node_modules/`** directory consists of all the dependencies installed using npm.    

 - **`public/`** directory consists of all the static files served by the web app (i.e. JavaScripts, CSS stylesheets, images and fonts).  
 
 - **`routes/`** directory consists of all route files. A route file consists of functions that generate HTTP responses based on the requests received. These responses could be for example a rendered HTML template or simply JSON. Note that each function is mapped to exactly one URL. 

 - **`tests/`** directory consists of all functional and unit tests.

 - **`utilities/`** directory consists of all helper functions and database population/configuration scripts. 

 - **`views/`** directory consists of all HTML templates. 
 
 - **`.gitignore`**: Consists a lists of files and directories that you do not want to track using version control.
 
 - **`app.js`**:  Main configuration file for the Express.js app. All routes are also defined here.

 - **`npm-debug.log`**:  Consists of error logs (useful for debugging).

 - **`package.json`**:  This file is used to give information to npm that allows it to identify the project as well as handle the project's dependencies. 

 - **`start_app.bat`**:  Script to start up the MongoDB server.

 - **`start_app_test.bat`**:  Script to start up the app in production mode (i.e. with production database).

 - **`start_mongodb.bat`**:  Script to start up the app in development mode (i.e. with test database).

----------
## Testing ##
 The test directory  `tricorder_app/tests` has the following structure: 

    tests/
	    test.js
		util.js

These files are: 

 - **`tests.js`**: Main test file consisting of all unit and functional tests, divided into multiple `describe` closures, each having a description of what's exactly being tested by the tests defined within that closure. 
 
 - **`util.py`**: Consists of utility functions for clearing the database and user authentication. Also contains sample data for each of the database collections.  

To run the entire test suite, all you need to do is execute the following command from the project root directory `tricorder_app/`: 
```
$ mocha tests
```   