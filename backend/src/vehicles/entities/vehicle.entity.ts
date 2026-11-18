
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum VehicleType {
    CAR = 'CAR',
    MOTORCYCLE = 'MOTORCYCLE',
    SCOOTER = 'SCOOTER',
    VAN = 'VAN',
    BUS = 'BUS',
    TRUCK = 'TRUCK',
    PICKUP = 'PICKUP',
}

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    vehicleCode: string;

    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Column({ type: 'varchar', length: 100 })
    brand: string;

    @Column({ type: 'varchar', length: 100 })
    model: string;

    @Column({
        type: 'enum',
        enum: VehicleType,
    })
    vehicleType: VehicleType;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: string;

    @Column({ type: 'text', nullable: true })
    imageUrl: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
