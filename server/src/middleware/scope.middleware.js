import ApiError from "../utils/ApiError.js";

export const requireScopes = ({
    scopes = [],
    mode = "ALL"
}) => {

    return (req, res, next) => {

        try {

            const grantedScopes =
                req.apiKeyContext?.scopes || [];

            let authorized = false;

            if (mode === "ALL") {

                authorized = scopes.every(
                    scope =>
                        grantedScopes.includes(scope)
                );

            } else {

                authorized = scopes.some(
                    scope =>
                        grantedScopes.includes(scope)
                );

            }

            if (!authorized) {
                throw new ApiError(
                    403,
                    "Insufficient API key scopes."
                );
            }

            next();

        } catch (error) {
            next(error);
        }

    };

};