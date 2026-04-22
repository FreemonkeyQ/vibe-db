-- CreateTable
CREATE TABLE "Relation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cardinality" TEXT NOT NULL DEFAULT 'ONE_TO_MANY',
    "schemaId" TEXT NOT NULL,
    "sourceTableId" TEXT NOT NULL,
    "sourceFieldId" TEXT NOT NULL,
    "targetTableId" TEXT NOT NULL,
    "targetFieldId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE CASCADE ON UPDATE CASCADE;
