import { Form } from "@remix-run/react";
import { useLoaderData } from "remix-utils";

// export async function loader({ request }) {
//     return Projects();
// }

export async function action({ request }) {
    const form = await request.formData();
    console.log(form.get("title"))
}

export default function Projects() {

    return (
        <div>
            <Form method="post">
                <input name="title" />
                <button type="submit">
                    Create New Project
                </button>
            </Form>
        </div>
    );
}