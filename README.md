# Robot Studio

An interactive 3D explorer for the Unitree, Fourier, and AgiBot models listed in [Awesome Robot Descriptions](https://github.com/robot-descriptions/awesome-robot-descriptions). Rotate each complete robot, inspect its functional assemblies and individual visual meshes, isolate a part, and move continuously from the assembled model to a tidy parts inventory.

This repo references [ashemag/model-x-studio](https://github.com/ashemag/model-x-studio).

## Included robots

- **Unitree humanoids:** G1, H1
- **Unitree quadrupeds:** A1, Aliengo, B1, B2, Go1, Go2
- **Fourier humanoids:** GR-1, N1
- **AgiBot humanoid:** X1

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

Open <http://localhost:3017>.

## Vercel

Import this repository into Vercel with the repository root as the project root. The checked-in `vercel.json` builds the app with `npm run build` and serves `dist`. No environment variables or database are required.

Configuration reference: https://vercel.com/docs/project-configuration/vercel-json

## Validate

```sh
npm run validate
npm run check
npm run build
```

## Complete robot models

The viewer loads the complete visual assembly declared by each robot's upstream URDF, including its authored STL/DAE meshes and fixed link transforms. Browser-ready GLB conversions are stored in `public/models/robots/` so each robot loads as one request; if an asset is absent, the viewer falls back to loading the upstream URDF directly.

The resulting meshes are the real description-package visuals rather than procedural stand-ins. They are still simulation/research descriptions, not OEM service-part catalogs, and a visual mesh does not necessarily correspond to a separately orderable part.

At runtime, each independently loaded URDF visual mesh or primitive is one selectable piece. A piece is not a triangle. The explosion slider has three stages:

1. **Assembled:** the complete source visual model.
2. **Structural explosion:** functional assemblies move apart while related meshes stay together.
3. **Parts inventory:** every visual mesh receives its own non-overlapping projected-bounds slot and the camera reframes to show the full arrangement.

### Rebuild the model assets

Clone the upstream repositories into one source directory using the names `unitree_ros`, `wiki_grx`, and `wiki_n1`, then run:

```sh
python -m pip install -r scripts/requirements-models.txt
python scripts/build-models.py --source-root C:\path\to\robot-model-sources
```

The script pins and records the source revisions, reads visual geometry only, and writes `manifest.json` beside the generated GLBs. See [`public/models/robots/ATTRIBUTION.md`](public/models/robots/ATTRIBUTION.md) for model provenance.

`build-models.py` also supports building models from upstream repositories that don't declare a redistribution license. Pass `--include-unlicensed` to generate the local-only cache for those models; the resulting `*.local.glb` assets are excluded from version control.

```sh
python scripts/build-models.py --source-root C:\path\to\robot-model-sources --include-unlicensed
```
