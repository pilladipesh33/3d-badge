/* eslint-disable react/no-unknown-property */
import * as THREE from "three";
import { useRef, useState } from "react";
import { Canvas, extend, useThree, useFrame } from "@react-three/fiber";
import {
	BallCollider,
	CuboidCollider,
	Physics,
	RigidBody,
	useRopeJoint,
	useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

//Need to use the extend for using meshline component
extend({ MeshLineGeometry, MeshLineMaterial });

export default function App() {
	function Band() {
		// References for the band and the joints
		const band = useRef();
		const fixed = useRef();
		const j1 = useRef();
		const j2 = useRef();
		const j3 = useRef();

		//CARD
		const card = useRef();
		const vec = new THREE.Vector3();
		const ang = new THREE.Vector3();
		const rot = new THREE.Vector3();
		const dir = new THREE.Vector3();
		const [dragged, drag] = useState(false);

		// Canvas size
		const { width, height } = useThree((state) => state.size);
		// A Catmull-Rom curve
		const [curve] = useState(
			() =>
				new THREE.CatmullRomCurve3([
					new THREE.Vector3(),
					new THREE.Vector3(),
					new THREE.Vector3(),
					new THREE.Vector3(),
				])
		);
		//define physics joint
		useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
		useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
		useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
		useSphericalJoint(j3, card, [
			[0, 0, 0],
			[0, 1.45, 0],
		]); //for band

		//creating a curve and adjusting the refresh rate based on monitor
		useFrame((state) => {
			if (dragged) {
				vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
				dir.copy(vec).sub(state.camera.position).normalize();
				vec.add(dir.multiplyScalar(state.camera.position.length()));
				card.current.setNextKinematicTranslation({
					x: vec.x - dragged.x,
					y: vec.y - dragged.y,
					z: vec.z - dragged.z,
				});
			}

			// Calculate Catmull curve
			curve.points[0].copy(j3.current.translation());
			curve.points[1].copy(j2.current.translation());
			curve.points[2].copy(j1.current.translation());
			curve.points[3].copy(fixed.current.translation());
			band.current.geometry.setPoints(curve.getPoints(32));
			// Tilt the card back towards the screen
			ang.copy(card.current.angvel());
			rot.copy(card.current.rotation());
			card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
		});

		return (
			<>
				<RigidBody ref={fixed} type="fixed" />
				<RigidBody position={[0.5, 0, 0]} ref={j1}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[1, 0, 0]} ref={j2}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[1.5, 0, 0]} ref={j3}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<mesh ref={band}>
					<meshLineGeometry />
					<meshLineMaterial
						color="white"
						resolution={[width, height]}
						lineWidth={1}
					/>
				</mesh>
			</>
		);
	}

	return (
		<Canvas>
			<Physics>{<Band />}</Physics>
		</Canvas>
	);
}
