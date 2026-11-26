import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehiclesTable1794985910678 implements MigrationInterface {
    name = 'CreateVehiclesTable1794985910678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."vehicles_vehicletype_enum" AS ENUM('CAR', 'MOTORCYCLE', 'SCOOTER', 'VAN', 'BUS', 'TRUCK', 'PICKUP')`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicleCode" character varying(20) NOT NULL, "name" character varying(150) NOT NULL, "brand" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "vehicleType" "public"."vehicles_vehicletype_enum" NOT NULL, "year" integer NOT NULL, "description" text, "price" numeric(12,2) NOT NULL, "imageUrl" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_549deed15b57a005eacfa05eaf9" UNIQUE ("vehicleCode"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_vehicletype_enum"`);
    }

}