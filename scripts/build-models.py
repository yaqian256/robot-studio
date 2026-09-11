"""Build browser-ready GLB assemblies from upstream URDF visual geometry."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from yourdfpy import URDF


@dataclass(frozen=True)
class ModelSource:
    robot_id: str
    repository: str
    revision: str
    license: str
    urdf: str
    redistributable: bool = True


MODELS = (
    ModelSource("unitree-g1", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/g1_description/g1_29dof.urdf"),
    ModelSource("unitree-g1-23dof", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/g1_description/g1_23dof.urdf"),
    ModelSource("unitree-h1", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/h1_description/urdf/h1.urdf"),
    ModelSource("unitree-h1-2", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/h1_2_description/h1_2.urdf"),
    ModelSource("unitree-h1-2-handless", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/h1_2_description/h1_2_handless.urdf"),
    ModelSource("unitree-h1-2-ftp-hand", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/h1_2_description/h1_2_with_FTP_hand.urdf"),
    ModelSource("unitree-a1", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/a1_description/urdf/a1.urdf"),
    ModelSource("unitree-b1", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/b1_description/xacro/b1.urdf"),
    ModelSource("unitree-b2", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/b2_description/urdf/b2_description.urdf"),
    ModelSource("unitree-go1", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/go1_description/urdf/go1.urdf"),
    ModelSource("unitree-go2", "https://github.com/unitreerobotics/unitree_ros", "7d6075f7f58588b189b940130e3edab3c839b2df", "BSD-3-Clause", "unitree_ros/robots/go2_description/urdf/go2_description.urdf"),
    # unitree-aliengo omitted: yourdfpy/trimesh export corrupts its mirrored thigh transforms; app falls back to live URDF loading.
    # unitree-laikago removed: same trimesh mirrored-mesh export corruption, and the robot is no longer offered in the catalog.
    ModelSource("fourier-gr1", "https://github.com/FFTAI/Wiki-GRx-Models", "7d96c758f048fe1bf92b3258864d94771ae0c093", "GPL-3.0", "wiki_grx/GRX/GR1/gr1t2/basic_urdf/gr1t2_dummy_hand.urdf"),
    ModelSource("fourier-gr2", "https://github.com/FFTAI/Wiki-GRx-Models", "7d96c758f048fe1bf92b3258864d94771ae0c093", "GPL-3.0", "wiki_grx/GRX/GR2/gr2v3_8_7/basic_urdf/gr2v3_8_7.urdf"),
    ModelSource("fourier-gr3", "https://github.com/FFTAI/Wiki-GRx-Models", "7d96c758f048fe1bf92b3258864d94771ae0c093", "GPL-3.0", "wiki_grx/GRX/GR3/gr3v2_1_1/basic_urdf/gr3v2_1_1.urdf"),
    ModelSource("fourier-n1", "https://github.com/FFTAI/Wiki-GRx-Models/tree/FourierN1", "f8e683f00d1d99deb882deb9dfce6030095b466a", "Apache-2.0", "wiki_n1/N1/urdf/N1_raw.urdf"),
    ModelSource("agibot-x1", "https://github.com/AgibotTech/agibot_x1_train", "e6651b9ab843fd1b1be70c087bfb7e8b28e44ccd", "No license declared", "agibot_x1/resources/robots/x1/urdf/x1.urdf", False),
)


def build(source_root: Path, output_root: Path, include_unlicensed: bool) -> None:
    output_root.mkdir(parents=True, exist_ok=True)
    manifest = []
    for model in MODELS:
        if not model.redistributable and not include_unlicensed:
            continue
        urdf_path = source_root / model.urdf
        if not urdf_path.is_file():
            raise FileNotFoundError(f"Missing {model.robot_id} source: {urdf_path}")
        print(f"Loading {model.robot_id} from {urdf_path}")
        robot = URDF.load(str(urdf_path))
        scene = robot.scene
        output_name = f"{model.robot_id}{'' if model.redistributable else '.local'}.glb"
        output_path = output_root / output_name
        output_path.write_bytes(scene.export(file_type="glb"))
        bounds = scene.bounds.tolist()
        record = {
            "id": model.robot_id,
            "url": f"/models/robots/{output_name}",
            "source": model.repository,
            "revision": model.revision,
            "license": model.license,
            "urdf": model.urdf,
            "visuals": len(scene.geometry),
            "links": len(robot.robot.links),
            "joints": len(robot.robot.joints),
            "bytes": output_path.stat().st_size,
            "bounds": bounds,
            "redistributable": model.redistributable,
        }
        manifest.append(record)
        print(f"Wrote {output_path.name}: {record['visuals']} visuals, {record['bytes'] / 1_000_000:.1f} MB")
    (output_root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True, help="Folder containing unitree_ros, wiki_grx, wiki_n1, and optionally agibot_x1")
    parser.add_argument("--output-root", type=Path, default=Path("public/models/robots"))
    parser.add_argument("--include-unlicensed", action="store_true", help="Generate the local-only AgiBot X1 asset")
    args = parser.parse_args()
    build(args.source_root.resolve(), args.output_root.resolve(), args.include_unlicensed)


if __name__ == "__main__":
    main()
