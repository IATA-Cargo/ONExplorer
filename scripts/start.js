const concurrently = require('concurrently');

concurrently([
    { command: 'react-scripts start', name: 'REACT' },
    { command: 'node server/expressServer.js', name: 'EXPRESS' }
]);
