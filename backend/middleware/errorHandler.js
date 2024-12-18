
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500; // Default to Internal Server Error
    let message = err.message || 'Internal Server Error';


 // Handle errors containing "Cast to ObjectId failed"
 if (err.message && err.message.includes("Cast to ObjectId failed")) {
    console.log("Handling CastError based on message");
    message = `Invalid ID format`;
    statusCode = 400; // Bad Request
}
    
    // Log error (optional)
    console.error(`[ERROR] ${err.stack || err.message}`);




    // Send structured error response
    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : null, // Show stack only in development
    });
};

module.exports = errorHandler;




