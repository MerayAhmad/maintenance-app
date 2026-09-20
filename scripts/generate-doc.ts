import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} from 'docx';

async function buildWordFile() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: 'نظام إدارة الصيانة والأصول الذكي (CMMS) | التقرير التعريفي الشامل',
                    font: 'Calibri',
                    size: 18,
                    color: '718096'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: 'صفحة ',
                    font: 'Calibri',
                    size: 18,
                    color: 'A0AEC0'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Calibri',
                    size: 18,
                    color: 'A0AEC0'
                  }),
                  new TextRun({
                    text: ' من ',
                    font: 'Calibri',
                    size: 18,
                    color: 'A0AEC0'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Calibri',
                    size: 18,
                    color: 'A0AEC0'
                  })
                ]
              })
            ]
          })
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 200, before: 100 },
            children: [
              new TextRun({
                text: '📋 التقرير التعريفي الشامل لنظام إدارة الصيانة والأصول (CMMS)',
                font: 'Calibri',
                size: 38,
                bold: true,
                color: '1A365D'
              })
            ]
          }),

          // Subtitle
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: 'دليل شامل حول إمكانيات النظام، آلية عمله، والأثر التشغيلي والمالي للمنشأة',
                font: 'Calibri',
                size: 22,
                italics: true,
                color: '4A5568'
              })
            ]
          }),

          // Section 1: Introduction
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: '🌟 1. نبذة عن التطبيق (ما هو النظام؟)',
                font: 'Calibri',
                size: 28,
                bold: true,
                color: '2B6CB0'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            bidirectional: true,
            spacing: { after: 250, line: 360 },
            children: [
              new TextRun({
                text: 'هو نظام رقمي متكامل لإدارة ومتابعة طلبات الصيانة وإدارة الأصول والمستودع. صُمم ليحل تماماً محل المعاملات الورقية، الرسائل المتناثرة، والاتصالات غير الموثقة داخل المنشأة؛ حيث يقوم بالربط المباشر والمنظم بين (الموظفين طالبي الصيانة، مدراء الأقسام، فريق الصيانة والفنيين، الإدارة العامة، ومسؤولي المستودع) في منصة رقمية موحدة وفورية.',
                font: 'Calibri',
                size: 24,
                color: '2D3748'
              })
            ]
          }),

          // Section 2: Features
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
            spacing: { before: 350, after: 150 },
            children: [
              new TextRun({
                text: '⚙️ 2. ما الذي يستطيع التطبيق فعله؟ (أهم القدرات والميزات)',
                font: 'Calibri',
                size: 28,
                bold: true,
                color: '2B6CB0'
              })
            ]
          }),

          // Feature A
          new Paragraph({
            bidirectional: true,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({
                text: '🔹 أ. دورة حياة متكاملة لطلبات الصيانة:',
                font: 'Calibri',
                size: 24,
                bold: true,
                color: '2C5282'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'إنشاء البلاغات بسهولة: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'إمكانية إرسال طلب صيانة سريع مع تحديد الماكينة، نوع العطل، درجة الأولوية (منخفضة/متوسطة/عاجلة)، ووصف المشكلة وإرفاق الصور التوضيحية.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'التوجيه والإسناد الذكي: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'فرز وتوجيه البلاغ للفني المختص حسب عبء العمل والتخصص وتحديد الوقت التقديري للإصلاح.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'إدارة مسار الورش الخارجية: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'في حال تطلب العطل ورشة خارجية متخصصة، يتم إطلاق مسار اعتماد رسمي يبدأ من مدير الصيانة ثم موافقة الإدارة العامة مع توثيق التكاليف وفواتير الورشة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'التتبع الفوري للحالات: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'حالات واضحة وشفافة (جديد ⬅️ مسند للفني ⬅️ قيد التنفيذ ⬅️ ورشة خارجية ⬅️ بانتظار الاعتماد ⬅️ مغلق ومكتمل).', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 150 },
            children: [
              new TextRun({ text: 'التقييم وتأكيد الاستلام: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'بعد إتمام الصيانة، يؤكد صاحب الطلب استلام المعدة بحالة سليمة ويقيم جودة العمل المنجز بالنجوم مع كتابة ملاحظاته.', font: 'Calibri', size: 22 })
            ]
          }),

          // Feature B
          new Paragraph({
            bidirectional: true,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: '🔹 ب. إدارة الأصول والمعدات (Asset Management):', font: 'Calibri', size: 24, bold: true, color: '2C5282' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'سجل شامل للأصول: توثيق الماكينات، الأقسام المالكة، الأرقام التسلسلية، الموديلات، والتواريخ.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'ترميز وتصنيف الأصول: ترميز كل ماكينة برقم وكود فني فريد مع ربطها بنوع الجهاز والقسم والموقع الجغرافي داخل المنشأة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 150 },
            children: [
              new TextRun({ text: 'السجل التاريخي (History Log): معرفة كافة الأعطال السابقة لكل ماكينة وتكلفة صيانتها وقطع الغيار المستبدلة فيها.', font: 'Calibri', size: 22 })
            ]
          }),

          // Feature C
          new Paragraph({
            bidirectional: true,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: '🔹 ج. إدارة المستودع وقطع الغيار (Inventory & Warehouse):', font: 'Calibri', size: 24, bold: true, color: '2C5282' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'حصر الأصناف وأسعارها وتحديد حد إعادة الطلب (Min Stock Level).', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'الخصم الآلي للقطع: خصم قطع الغيار تلقائياً من رصيد المستودع بمجرد إرفاقها بطلب الصيانة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 150 },
            children: [
              new TextRun({ text: 'تنبيهات فورية عند اقتراب نفاد أي قطعة غيار لتفادي توقف العمل المفاجئ.', font: 'Calibri', size: 22 })
            ]
          }),

          // Feature D
          new Paragraph({
            bidirectional: true,
            spacing: { before: 150, after: 100 },
            children: [
              new TextRun({ text: '🔹 د. مؤشرات الأداء والتقارير الذكية (Analytics & KPIs):', font: 'Calibri', size: 24, bold: true, color: '2C5282' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'لوحة قيادة تفاعلية توضح سرعة الاستجابة، معدل الإنجاز، وإجمالي التكاليف.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'تصدير تقارير صيانة رسمية وطباعة أوامر العمل وبطاقات الاستلام بصيغة PDF و Word.', font: 'Calibri', size: 22 })
            ]
          }),

          // Section 3: How it works
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
            spacing: { before: 350, after: 150 },
            children: [
              new TextRun({
                text: '🔄 3. آلية عمل التطبيق (Workflow)',
                font: 'Calibri',
                size: 28,
                bold: true,
                color: '2B6CB0'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '1. التبليغ والتسجيل: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'الموظف يكتشف الخلل ويرسل طلب الصيانة إلكترونياً بثوانٍ معدودة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '2. المراجعة والإسناد: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'مدير الصيانة يعاين البلاغ، يحدد أولوية التدخل، ويسند المهمة للفني المختص.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '3. التنفيذ الفعلي: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'يستلم الفني الإشعار، يبدأ الإصلاح، يصرف قطع الغيار المطلوبة، ويوثق التقرير الفني عند الانتهاء.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '4. الورشة الخارجية (عند الحاجة): ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'تحويل الطلب للمسار الخارجي، موافقة المدير العام، ثم تسليم واستلام الأصل من الورشة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 250 },
            children: [
              new TextRun({ text: '5. الاعتماد والتقييم: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'اعتماد مدير الصيانة لإغلاق الطلب، وتأكيد طالب الصيانة لاستلام الجهاز وتقييم الجودة.', font: 'Calibri', size: 22 })
            ]
          }),

          // Section 4: Roles & Permissions
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
            spacing: { before: 350, after: 150 },
            children: [
              new TextRun({
                text: '👥 4. تخصيص الأدوار والصلاحيات (من يرى ماذا؟)',
                font: 'Calibri',
                size: 28,
                bold: true,
                color: '2B6CB0'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'الموظف العادي (Employee): ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'يرى طلبات قسمه وطلباته الخاصة، ويقوم بإنشاء البلاغات ومتابعتها وتقييم الخدمة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'فني الصيانة (Technician): ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'يرى الطلبات المُسندة إليه للعمل عليها وطلباته الشخصية، ويسجل وقت الصيانة وقطع الغيار المستخدمة.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'مدير الصيانة (Maintenance Manager): ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'تحكم كامل بتوزيع الطلبات، مراقبة الفنيين، إدارة الورش الخارجية، والموافقة على إغلاق البلاغات.', font: 'Calibri', size: 22 })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            bidirectional: true,
            spacing: { after: 250 },
            children: [
              new TextRun({ text: 'الإدارة العامة / مسؤول الاعتماد (External Approver / Admin): ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: 'رؤية شاملة للتقارير الاستراتيجية والاعتمادات المالية لطلبات الصيانة الخارجية وإدارة النظام بالكامل.', font: 'Calibri', size: 22 })
            ]
          }),

          // Section 5: Benefits Table
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
            spacing: { before: 350, after: 150 },
            children: [
              new TextRun({
                text: '💡 5. جدول الفوائد والمكاسب المحققة للمنشأة',
                font: 'Calibri',
                size: 28,
                bold: true,
                color: '2B6CB0'
              })
            ]
          }),

          // Table
          new Table({
            alignment: AlignmentType.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: '2B6CB0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [
                          new TextRun({ text: 'المجال / الفائدة', font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: '2B6CB0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [
                          new TextRun({ text: 'الأثر التشغيلي والمالي المباشر', font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F7FAFC' },
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'تقليل وقت توقف الماكينات (Downtime)', font: 'Calibri', size: 20, bold: true, color: '1A202C' })]
                      })
                    ]
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F7FAFC' },
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'سرعة وصول البلاغ للفني والبدء بالإصلاح الفوري بدون تأخيرات إدارية، مما يحافظ على استمرارية خطوط الإنتاج.', font: 'Calibri', size: 20 })]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'إلغاء المعاملات الورقية (Paperless)', font: 'Calibri', size: 20, bold: true, color: '1A202C' })]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'أرشفة رقمية بنسبة 100% لجميع أوامر الشغل وتقارير الصيانة واستلام المعدات وسهولة الرجوع لها.', font: 'Calibri', size: 20 })]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F7FAFC' },
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'ضبط التكاليف والمخزون', font: 'Calibri', size: 20, bold: true, color: '1A202C' })]
                      })
                    ]
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F7FAFC' },
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'معرفة تكلفة صيانة كل أصل بدقة، ومراقبة حركة قطع الغيار ومنع الهدر والسرقة أو الفاقد.', font: 'Calibri', size: 20 })]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'شفافية ومساءلة دقيقة', font: 'Calibri', size: 20, bold: true, color: '1A202C' })]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'معرفة المسؤول عن كل خطوة وتاريخ تنفيذها بالوقت والدقيقة وتقييم كفاءة كل فني بصورة موضوعية.', font: 'Calibri', size: 20 })]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F7FAFC' },
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'قرارات استبدال واستثمار صائبة', font: 'Calibri', size: 20, bold: true, color: '1A202C' })]
                      })
                    ]
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F7FAFC' },
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        children: [new TextRun({ text: 'تحديد الماكينات المتهالكة التي تكلف صيانتها مبالغ تتجاوز قيمتها، مما يساعد الإدارة في اتخاذ قرارات التجديد.', font: 'Calibri', size: 20 })]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Conclusion
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: '🎯 الخلاصة:',
                font: 'Calibri',
                size: 26,
                bold: true,
                color: '1A365D'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'هو المساعد الرقمي الذي يحوّل عمليات الصيانة من فوضى ورقية غير قابلة للتتبع، إلى منظومة إلكترونية سريعة، منظمة، وشفافة تضمن بقاء جميع أصول المنشأة في أفضل كفاءة تشغيلية بأقل تكلفة ممكنة.',
                font: 'Calibri',
                size: 24,
                bold: true,
                color: '2C5282'
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'CMMS_System_Report.docx'), buffer);
  fs.writeFileSync(path.join(publicDir, 'تقرير_نظام_إدارة_الصيانة_والأصول_CMMS.docx'), buffer);
  console.log('Word reports generated successfully in public/ folder!');
}

buildWordFile();
