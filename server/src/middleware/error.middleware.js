import dotenv from "dotenv";

dotenv.config();

const errorHandler = (err, req, res, next) => {

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server error !"

    if(process.env.NODE_ENV === "development"){
        console.error("\n========== ERROR ==========");
        console.error("Message:", message);
        console.error("Status:", statusCode);
        console.error("Method:", req.method);
        console.error("URL:", req.originalUrl);
        console.error("Stack:");
        console.error(err.stack);
        console.error("===========================\n");
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        errors : err.errors || []
    });

};

export default errorHandler;