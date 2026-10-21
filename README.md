# GeometryX

Web app that helps students learn to calculate the area of flat shapes and the volume of solid shapes.

Students enter their biodata (name, school, class, age, gender, optional student ID), pick a shape, enter its measurements and see the result together with the formula. Finished sessions are saved in the browser and can be exported to `.txt` or `.csv`. A dashboard shows totals and percentages, and the history can be searched, sorted and re-imported from `.csv`.

- **Area (2D):** square, triangle, circle
- **Volume (3D):** cube, pyramid (rectangular base), cylinder
- **Export:** biodata and calculation results in separate sections, with completion date and timestamp
- **Sorting:** by name, school, age or save time
- **Language:** Bahasa Indonesia

Built with React, TypeScript, Vite, Tailwind CSS and shadcn/ui.

## Project structure

```
.
├── index.html              Page shell and SEO metadata
├── public/                 Favicon and robots.txt
└── src/
    ├── main.tsx            App entry point
    ├── App.tsx             Layout, tabs, and session/history state
    ├── index.css           Tailwind setup and theme
    ├── types.ts            Shared types (biodata, calculation, session record)
    ├── components/
    │   ├── BiodataForm.tsx     Student biodata form
    │   ├── Calculator.tsx      Shape picker, inputs and result
    │   ├── SessionPanel.tsx    Current session and export actions
    │   ├── Dashboard.tsx       Statistics, history table, import/export
    │   ├── ShapeIcon.tsx       Shape illustrations
    │   ├── Pilih.tsx           Select dropdown wrapper
    │   └── ui/                 shadcn/ui components
    └── lib/
        ├── shapes.ts       Shape definitions, formulas and validation
        ├── format.ts       Number, date and timestamp formatting
        ├── storage.ts      localStorage persistence
        ├── sort.ts         History sorting
        ├── stats.ts        Totals and percentages
        ├── export.ts       .txt and .csv export
        ├── import.ts       .csv parsing and merge
        ├── utils.ts        Class name helper
        └── lib.test.ts     Unit tests
```
