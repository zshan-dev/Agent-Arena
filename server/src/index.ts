import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { CLIENT_URL, NODE_ENV } from "../constants/env.constants";
import openapi from "@elysiajs/openapi";

const app = new Elysia()
	.use(
		cors({
			origin: [CLIENT_URL],
			methods: ["POST", "PATCH", "GET", "DELETE"],
		}),
	)
	.use(openapi({ enabled: NODE_ENV === "development" }))
	.get("/", () => "Hello Elysia")
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
