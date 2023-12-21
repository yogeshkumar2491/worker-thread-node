const express = require("express"),
  app = express(),
  { Worker } = require("worker_threads"),
  os = require("os"),
  port = process.env.PORT || 3000,
  cpuNums = os.cpus().length;

app.get("/non-blocking", (req, res) => {
  res.status(200).send("This page is non blocking");
});

app.get("/blocking", (req, res) => {
  const worker = new Worker("./worker.js");
  worker
    .on("message", (counter) =>
      res.status(200).send(`Result of counter : ${counter}`)
    )
    .on("error", (error) => {
      res.status(404).send(`An error occured ${error}`);
    });
});

app.get("/parallel-blocking", async (req, res) => {
  const workerPromises = [];
  for (let i = 0; i < cpuNums; i++) {
    workerPromises.push(createWorker());
  }

  const threadResults = await Promise.all(workerPromises);
  res
    .status(200)
    .send(
      `Result of counter : ${threadResults.reduce(
        (acc, current) => acc + current
      )}`
    );
});

function createWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./paraller-worker.js", {
      workerData: { thread_count: cpuNums },
    });

    worker.on("message", (counter) => resolve(counter));
    worker.on("error", (error) => reject(`An error occured ${error}`));
  });
}

app.listen(port, () => console.log(`app is running on port : ${port}`));
