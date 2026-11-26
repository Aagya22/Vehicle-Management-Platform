
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleImagesTable1795071679929
    implements MigrationInterface {
    name = 'CreateVehicleImagesTable1795071679929';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "vehicle_images" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "imageUrl" text NOT NULL,
                "publicId" character varying(255) NOT NULL,
                "isPrimary" boolean NOT NULL DEFAULT false,
                "displayOrder" integer NOT NULL DEFAULT 0,
                "vehicleId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_eda0b40112c9b3c42687416e5c0"
                    UNIQUE ("publicId"),
                CONSTRAINT "PK_62a037bce2dae7af30fc41cc984"
                    PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicle_images"
            ADD CONSTRAINT "FK_9a907b93045b8793801158fbba2"
            FOREIGN KEY ("vehicleId")
            REFERENCES "vehicles"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            DROP COLUMN "imageUrl"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ADD "imageUrl" text
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicle_images"
            DROP CONSTRAINT "FK_9a907b93045b8793801158fbba2"
        `);

        await queryRunner.query(`
            DROP TABLE "vehicle_images"
        `);
    }
}
