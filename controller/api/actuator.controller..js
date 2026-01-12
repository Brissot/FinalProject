import express from 'express';

const router= express.Router();

/** actuator endpoint */
router.get("/healthz", (request, response) => {
    response.status(200).send("OK: College Football Stats is up");
});

export default router;