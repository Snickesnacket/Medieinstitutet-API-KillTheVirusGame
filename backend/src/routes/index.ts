import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.send({
    message: "I AM API, BEEP BOOP",
  });
});

export default router;
