
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';
import type { Vehicle } from './vehicle.entity.js';

@Entity('vehicle_images')
export class VehicleImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    imageUrl: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    publicId: string;

    @Column({ type: 'boolean', default: false })
    isPrimary: boolean;

    @Column({ type: 'int', default: 0 })
    displayOrder: number;

    @ManyToOne(
        'Vehicle',
        'images',
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'vehicleId' })
    vehicle: Relation<Vehicle>;

    @Column({ type: 'uuid' })
    vehicleId: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
