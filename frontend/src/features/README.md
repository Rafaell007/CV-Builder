# Features

One folder per feature. Each feature folder has the same shape, and so does every child big enough to need its own hooks or utils:

```
<feature>/
  index.ts                # public entry, the only file imported from outside
  README.md               # 5–10 lines: purpose, exports, used by, docs link
  Feature.tsx             # representational component
  Feature.test.tsx
  useFeature/             # composed hook: useFeature.ts, useFeature.test.ts, index.ts
  utils/                  # feature.utils.ts, feature.utils.test.ts, index.ts
  feature.types.ts
  messages/               # en.json, pl.json: the feature's texts, same keys (see shared/i18n/README.md)
  components/
    Child/                # same shape, one level down
```

Code used by one parent stays inside it. Code needed by two siblings moves to their nearest common ancestor; only code used by unrelated features goes to `src/shared/`. See [PLAN.md §5.9](../../PLAN.md#59-fractal-structure).
