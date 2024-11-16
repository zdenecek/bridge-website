import { match } from "assert";
import path, { format } from "path";
import { Collection, defineConfig, Field } from "tinacms";

const singleton = {
  ui: {
    allowedActions: {
      create: false,
      delete: false,
    },
  },
};

const languageCollections = {
  en: [
    { path: "about-me", props: singleton },
    { path: "software" },
    { name: "home", props: { ...singleton, match: { include: "_index" } } },
    { name: "links", props: { ...singleton, match: { include: "links" } } },
  ],
  cs: [],
};

// @ts-ignore
const contentCollections: Collection[] = Object.entries(
  languageCollections
).flatMap(([lang, contentType]) =>
  contentType.map((contentType) => ({
    label: `${lang} ${contentType.name ?? contentType.path}`,
    name: `${lang}_${contentType.name ?? contentType.path.replace("-", "_")}`,
    path: `content/${lang}/${contentType.path ?? ""}`,
    format: "md",
    ...(contentType.props ?? {}),
    fields: [
      {
        type: "string",
        label: "Title",
        name: "title",
        isTitle: true
      },
      {
        type: "rich-text",
        label: "Post Body",
        name: "body",
        isBody: true,
      },
    ],
  }))
);


// @ts-ignore
const tournamentFields: Field[] = [
  {
    type: "string", 
    label: "Title",
    name: "title",
  },
  {
    type: "string",
    label: "Date",
    name: "date",
  },
  {
    type: "string",
    label: "Slug",
    name: "slug",
  }
];


const tournamentCollections: Collection[] = [
  {
    label: "Tournaments",
    name: "tournaments",
    format: "json",
    path: "data",
    include: { match: "^tournaments$"},
    fields: [

      {
        type: "object",
        label: "English",
        name: "en",
        fields: tournamentFields
      },
      {
        type: "object",
        label: "Czech",
        name: "cs",
        fields: tournamentFields
      },
    ]
  }
]

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [...contentCollections, ...tournamentCollections ],
  },
});
